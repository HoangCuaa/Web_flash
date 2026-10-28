// backend/api/v1/leaderboard/global.js
import { handleCors, sendSuccess, sendError } from '../../../lib/http.js';
import { validate, paginationSchema } from '../../../lib/validation.js';
import { getGlobalLeaderboard } from '../../../services/leaderboard-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const { page, limit } = validate(paginationSchema, req.query);
    const result = await getGlobalLeaderboard(page, limit);

    return sendSuccess(res, result.items, result.pagination);
  } catch (error) {
    return sendError(res, error, req);
  }
}
