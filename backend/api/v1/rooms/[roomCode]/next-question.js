// backend/api/v1/rooms/[roomCode]/next-question.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { verifyGuest } from '../../../../lib/auth.js';
import { advanceNextQuestion } from '../../../../services/gameplay-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const guest = await verifyGuest(req);
    const { roomCode } = req.query;

    const result = await advanceNextQuestion(roomCode, guest.id);

    return sendSuccess(res, result, { message: 'Đã chuyển câu hỏi' });
  } catch (error) {
    return sendError(res, error, req);
  }
}
