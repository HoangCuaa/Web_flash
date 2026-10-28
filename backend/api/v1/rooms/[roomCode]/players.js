// backend/api/v1/rooms/[roomCode]/players.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { getRoomPlayers } from '../../../../services/room-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const { roomCode } = req.query;
    const players = await getRoomPlayers(roomCode);

    return sendSuccess(res, players);
  } catch (error) {
    return sendError(res, error, req);
  }
}
