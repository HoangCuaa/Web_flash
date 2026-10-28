// backend/api/v1/rooms/[roomCode]/skip.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { verifyGuest } from '../../../../lib/auth.js';
import { skipQuestion } from '../../../../services/gameplay-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const guest = await verifyGuest(req);
    const { roomCode } = req.query;
    const { questionId } = req.body || {};

    if (!questionId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'questionId là bắt buộc' } });
    }

    const result = await skipQuestion(roomCode, guest.id, questionId);

    return sendSuccess(res, result, { message: 'Đã bỏ qua câu hỏi' });
  } catch (error) {
    return sendError(res, error, req);
  }
}
