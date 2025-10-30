import type { IncomingMessage, ServerResponse } from 'http';

type RequestHandler = (req: IncomingMessage, res: ServerResponse) => void;

declare namespace SuperTest {
  interface Response {
    status: number;
    ok: boolean;
    headers: Record<string, string>;
    body: unknown;
    text: string;
  }

  interface PostBuilder {
    set(field: string, value: string): PostBuilder;
    send(payload: unknown): Promise<Response>;
  }

  interface Request {
    get(path: string): Promise<Response>;
    post(path: string): PostBuilder;
  }
}

export default function request(app: RequestHandler): SuperTest.Request;
export type Response = SuperTest.Response;
