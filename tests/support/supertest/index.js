import { createServer } from 'http';

function request(app) {
  function execute(method, path, payload, headers = {}) {
    return new Promise((resolve, reject) => {
      const server = createServer(app);

      const finalize = async () => {
        try {
          const address = server.address();
          if (!address || typeof address === 'string') {
            throw new Error('Unable to determine server address');
          }

          const url = `http://127.0.0.1:${address.port}${path}`;
          const init = { method, headers: { ...headers } };

          if (payload !== undefined) {
            if (payload instanceof Uint8Array || typeof payload === 'string') {
              init.body = payload;
            } else {
              init.body = JSON.stringify(payload);
              if (!init.headers['Content-Type'] && !init.headers['content-type']) {
                init.headers['Content-Type'] = 'application/json';
              }
            }
          }

          const response = await fetch(url, init);
          const contentType = response.headers.get('content-type') || '';
          let body;

          if (contentType.includes('application/json')) {
            body = await response.json();
          } else if (contentType.includes('text/')) {
            body = await response.text();
          } else {
            const buffer = await response.arrayBuffer();
            body = Buffer.from(buffer);
          }

          const headersObj = {};
          response.headers.forEach((value, key) => {
            headersObj[key.toLowerCase()] = value;
          });

          resolve({
            status: response.status,
            ok: response.ok,
            headers: headersObj,
            body,
            text:
              typeof body === 'string'
                ? body
                : Buffer.isBuffer(body)
                ? body.toString('utf8')
                : JSON.stringify(body),
          });
        } catch (error) {
          reject(error);
        } finally {
          server.close();
        }
      };

      server.once('error', reject);
      server.listen(0, finalize);
    });
  }

  return {
    get(path) {
      return execute('GET', path);
    },
    post(path) {
      const headers = {};
      return {
        set(field, value) {
          headers[field] = value;
          return this;
        },
        send(payload) {
          return execute('POST', path, payload, headers);
        },
      };
    },
  };
}

export default request;
export { request };
