// backend/api/v1/rooms/[roomCode]/index.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { getRoomByCode } from '../../../../services/room-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const { roomCode } = req.query;
    const room = await getRoomByCode(roomCode);

    return sendSuccess(res, room);
  } catch (error) {
    return sendError(res, error, req);
  }
}
