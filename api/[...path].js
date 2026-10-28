// api/[...path].js — Vercel Serverless Catch-All API Handler
import { routeApi } from '../backend/server/router.js';
import { setupResponseHelpers, parseRequestBody, handleOptionsCors } from '../backend/server/middleware.js';

export default async function handler(req, res) {
  if (handleOptionsCors(req, res)) return;
  setupResponseHelpers(res);

  const parsedUrl = new URL(req.url, `https://${req.headers['x-forwarded-host'] || req.headers.host || 'localhost'}`);
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());

  await parseRequestBody(req);

  return routeApi(req, res, parsedUrl.pathname);
}
