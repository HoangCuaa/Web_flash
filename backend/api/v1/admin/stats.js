// backend/api/v1/admin/stats.js
import { handleCors, sendSuccess, sendError } from '../../../lib/http.js';
import { verifyAdmin } from '../../../lib/auth.js';
import { adminGetStats } from '../../../services/quiz-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' },
    });
  }

  try {
    verifyAdmin(req);
    const stats = await adminGetStats();
    return sendSuccess(res, stats);
  } catch (error) {
    return sendError(res, error, req);
  }
}
