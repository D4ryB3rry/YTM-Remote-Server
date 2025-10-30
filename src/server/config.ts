/**
 * Server configuration
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),

  // YTMDesktop configuration
  ytmDesktop: {
    host: 'localhost',
    port: 9863,
    get baseUrl() {
      return `http://${this.host}:${this.port}`;
    },
    socketUrl: 'http://127.0.0.1:9863/api/v1/realtime',
  },

  // App configuration
  app: {
    id: 'ytmremoteserver',
    name: 'YTM Remote Server',
    version: '2.1.3',
  },

  // File paths
  paths: {
    authTokenFile: path.join(process.cwd(), 'authToken.txt'),
    publicDir: path.join(process.cwd(), 'public'),
  },

  // CORS configuration
  cors: {
    origin: '*',
    methods: ['GET', 'POST'] as string[],
  },
};
