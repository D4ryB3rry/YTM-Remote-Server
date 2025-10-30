import type { IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';

type NextFunction = () => void | Promise<void>;

type Middleware = (
  req: RequestLike,
  res: ResponseLike,
  next: NextFunction
) => void | Promise<void>;

type RouteHandler = (req: RequestLike, res: ResponseLike) => void | Promise<void>;

type Method = 'GET' | 'POST';

type QueryValue = string | string[];

interface RouteKey {
  method: Method;
  path: string;
}

export interface RequestLike {
  method: Method;
  headers: IncomingMessage['headers'];
  query: Record<string, QueryValue>;
  body: unknown;
  rawBody: string;
}

export interface ResponseLike {
  status(code: number): ResponseLike;
  json(payload: unknown): void;
  send(payload: unknown): void;
  setHeader(name: string, value: string): void;
}

export interface ExpressStub {
  (req: IncomingMessage, res: ServerResponse): void;
  use(middleware: Middleware): this;
  get(path: string, handler: RouteHandler): this;
  post(path: string, handler: RouteHandler): this;
}

const createRouteKey = ({ method, path }: RouteKey): string => `${method} ${path}`;

const parseQuery = (url: URL): Record<string, QueryValue> => {
  const result: Record<string, QueryValue> = {};
  url.searchParams.forEach((value, key) => {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const existing = result[key];
      result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      result[key] = value;
    }
  });
  return result;
};

const readBody = async (req: IncomingMessage): Promise<string> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
};

const runMiddleware = async (
  middleware: Middleware,
  req: RequestLike,
  res: ResponseLike
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    const next = () => resolve();
    try {
      const result = middleware(req, res, next);
      if (result instanceof Promise) {
        result.then(() => resolve()).catch((error) => reject(error));
      }
    } catch (error) {
      reject(error);
    }
  });
};

const createResponseWrapper = (res: ServerResponse): ResponseLike & {
  finished: boolean;
} => {
  const wrapper: ResponseLike & { finished: boolean } = {
    finished: false,
    status(code: number) {
      res.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      if (!res.getHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json');
      }
      const body = JSON.stringify(payload ?? {});
      res.end(body);
      this.finished = true;
    },
    send(payload: unknown) {
      if (payload instanceof Uint8Array || Buffer.isBuffer(payload)) {
        res.end(payload);
      } else if (typeof payload === 'string') {
        res.end(payload);
      } else {
        if (!res.getHeader('Content-Type')) {
          res.setHeader('Content-Type', 'application/json');
        }
        res.end(JSON.stringify(payload));
      }
      this.finished = true;
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
    },
  };

  return wrapper;
};

const jsonMiddleware = (): Middleware => (req, _res, next) => {
  if (req.rawBody.trim().length === 0) {
    req.body = {};
    return next();
  }

  try {
    req.body = JSON.parse(req.rawBody);
  } catch {
    req.body = {};
  }
  return next();
};

const createExpressStub = (): ExpressStub => {
  const middlewares: Middleware[] = [];
  const routes = new Map<string, RouteHandler>();

  const app = async (req: IncomingMessage, res: ServerResponse) => {
    const method = (req.method ?? 'GET').toUpperCase() as Method;
    const url = new URL(req.url ?? '/', 'http://localhost');
    const rawBody = await readBody(req);

    const request: RequestLike = {
      method,
      headers: req.headers,
      query: parseQuery(url),
      body: undefined,
      rawBody,
    };

    const response = createResponseWrapper(res);

    try {
      for (const middleware of middlewares) {
        if (response.finished) {
          return;
        }
        await runMiddleware(middleware, request, response);
      }

      if (response.finished) {
        return;
      }

      const handler = routes.get(createRouteKey({ method, path: url.pathname }));

      if (!handler) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      await handler(request, response);

      if (!response.finished) {
        res.end();
      }
    } catch (error) {
      console.error('[expressStub] Handler error:', error);
      if (!response.finished) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    }
  };

  app.use = (middleware: Middleware) => {
    middlewares.push(middleware);
    return app;
  };

  const register = (method: Method, path: string, handler: RouteHandler) => {
    routes.set(createRouteKey({ method, path }), handler);
    return app;
  };

  app.get = (path: string, handler: RouteHandler) => register('GET', path, handler);
  app.post = (path: string, handler: RouteHandler) => register('POST', path, handler);

  return app;
};

const expressStub = Object.assign(createExpressStub, {
  json: jsonMiddleware,
});

export default expressStub;
