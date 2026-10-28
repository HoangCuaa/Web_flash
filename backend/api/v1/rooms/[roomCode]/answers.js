// backend/api/v1/rooms/[roomCode]/answers.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { verifyGuest } from '../../../../lib/auth.js';
import { validate, submitAnswerSchema } from '../../../../lib/validation.js';
import { checkRateLimit } from '../../../../lib/rate-limit.js';
import { submitAnswer } from '../../../../services/gameplay-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const guest = await verifyGuest(req);
    const { roomCode } = req.query;

    // Rate-limiting nộp câu trả lời theo người chơi (tối đa 120 req/phút)
    checkRateLimit(`answer_${guest.id}`, 120, 60);

    const idempotencyKey = req.headers['idempotency-key'] || null;
    const body = validate(submitAnswerSchema, req.body);

    const result = await submitAnswer(roomCode, guest.id, body, idempotencyKey);

    return sendSuccess(res, result, { message: 'Đã ghi nhận câu trả lời' });
  } catch (error) {
    return sendError(res, error, req);
  }
}
