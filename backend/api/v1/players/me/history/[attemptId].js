// backend/api/v1/players/me/history/[attemptId].js
import { handleCors, sendSuccess, sendError } from '../../../../../lib/http.js';
import { verifyGuest } from '../../../../../lib/auth.js';
import { getAttemptDetail } from '../../../../../services/history-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const guest = await verifyGuest(req);
    const { attemptId } = req.query;

    const detail = await getAttemptDetail(guest.id, attemptId);

    return sendSuccess(res, detail);
  } catch (error) {
    return sendError(res, error, req);
  }
}
