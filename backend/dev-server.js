// backend/dev-server.js
// Local Development Server phục vụ cả API Backend và Static Frontend
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

import { setupResponseHelpers, parseRequestBody, handleOptionsCors } from './server/middleware.js';
import { routeApi } from './server/router.js';
import { serveStaticFile } from './server/static-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // 1. Xử lý CORS Preflight
  if (handleOptionsCors(req, res)) return;

  // 2. Thiết lập helper methods giống Express / Vercel: res.status(), res.json()
  setupResponseHelpers(res);

  // 3. Phân tích URL và Query Parameters
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());

  // 4. Phân tích JSON Body cho POST / PUT / PATCH
  await parseRequestBody(req);

  // 5. Phân phối API Route
  if (pathname.startsWith('/api/')) {
    return routeApi(req, res, pathname);
  }

  // 6. Phục vụ Static Frontend files (index.html, app.js, admin.html...)
  return serveStaticFile(req, res, pathname, ROOT_DIR);
});

server.listen(PORT, () => {
  console.log(`[LOCAL DEV SERVER] Đang chạy tại http://localhost:${PORT}`);
});
