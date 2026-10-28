// backend/api/v1/players/me/history.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { verifyGuest } from '../../../../lib/auth.js';
import { validate, paginationSchema } from '../../../../lib/validation.js';
import { getPlayerHistory, savePlayerAttempt } from '../../../../services/history-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method === 'POST') {
    try {
      const guest = await verifyGuest(req);
      const attempt = await savePlayerAttempt(guest.id, req.body || {});
      return sendSuccess(res, attempt, { message: 'Đã lưu lịch sử lượt thi thành công' });
    } catch (error) {
      return sendError(res, error, req);
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const guest = await verifyGuest(req);
    const { page, limit } = validate(paginationSchema, req.query);

    const historyData = await getPlayerHistory(guest.id, page, limit);

    return sendSuccess(res, historyData.items, historyData.pagination);
  } catch (error) {
    return sendError(res, error, req);
  }
}
