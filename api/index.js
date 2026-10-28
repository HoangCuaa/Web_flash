// api/index.js — Vercel Serverless Master API Entry Point
import { routeApi } from '../backend/server/router.js';
import { setupResponseHelpers, parseRequestBody, handleOptionsCors } from '../backend/server/middleware.js';

export default async function handler(req, res) {
  try {
    // 1. CORS Preflight
    if (handleOptionsCors(req, res)) return;
    setupResponseHelpers(res);

    // 2. Resolve pathname
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    let rawUrl = req.url || '/api';
    // Khi Vercel rewrite từ /api/(.*) -> /api/index.js, x-matched-path lưu đường dẫn thực tế của request
    if (req.headers['x-matched-path'] && (rawUrl === '/api/index.js' || rawUrl === '/api' || rawUrl === '/api/')) {
      rawUrl = req.headers['x-matched-path'];
    }

    const parsedUrl = new URL(rawUrl, `https://${host}`);
    const pathname = parsedUrl.pathname;

    // 3. Health Check nếu truy cập trực tiếp /api hoặc /api/
    if (pathname === '/api' || pathname === '/api/') {
      return res.status ? res.status(200).json({
        success: true,
        message: 'Quiz Platform API is running on Vercel Serverless',
        timestamp: new Date().toISOString(),
      }) : (
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }),
        res.end(JSON.stringify({
          success: true,
          message: 'Quiz Platform API is running on Vercel Serverless',
          timestamp: new Date().toISOString(),
        }))
      );
    }

    // 4. Merge query params
    req.query = { ...req.query, ...Object.fromEntries(parsedUrl.searchParams.entries()) };

    // 5. Parse body nếu có
    await parseRequestBody(req);

    // 6. Chuyển tiếp tới router
    return await routeApi(req, res, pathname);
  } catch (err) {
    console.error('[SERVERLESS FATAL ERROR]:', err);
    if (!res.headersSent) {
      const statusCode = err.statusCode || 500;
      res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: false,
        error: {
          code: err.code || 'SERVERLESS_INVOCATION_ERROR',
          message: err.message || 'Lỗi xử lý Serverless Function',
        },
      }));
    }
  }
}
