// backend/api/v1/rooms/index.js
import { handleCors, sendSuccess, sendError } from '../../../lib/http.js';
import { verifyGuest } from '../../../lib/auth.js';
import { validate, createRoomSchema } from '../../../lib/validation.js';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit.js';
import { createRoom } from '../../../services/room-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const ip = getClientIp(req);
    checkRateLimit(`room_create_${ip}`, 15, 60);

    const guest = await verifyGuest(req);
    const { quizId, maxPlayers, timePerQuestion } = validate(createRoomSchema, req.body);

    const newRoom = await createRoom(guest.id, quizId, maxPlayers, timePerQuestion);

    return sendSuccess(res, newRoom, { message: 'Tạo phòng thành công' }, 201);
  } catch (error) {
    return sendError(res, error, req);
  }
}
