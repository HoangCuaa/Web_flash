// backend/api/v1/rooms/[roomCode]/join.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { verifyGuest } from '../../../../lib/auth.js';
import { validate, joinRoomSchema } from '../../../../lib/validation.js';
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limit.js';
import { joinRoom } from '../../../../services/room-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const ip = getClientIp(req);
    checkRateLimit(`room_join_${ip}`, 30, 60);

    const guest = await verifyGuest(req);
    const { roomCode } = req.query;
    const { nickname } = validate(joinRoomSchema, req.body || { nickname: guest.nickname });

    const result = await joinRoom(roomCode, guest.id, nickname);

    return sendSuccess(res, result, { message: 'Tham gia phòng thành công' });
  } catch (error) {
    return sendError(res, error, req);
  }
}
