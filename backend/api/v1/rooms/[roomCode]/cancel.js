// backend/api/v1/rooms/[roomCode]/cancel.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { verifyGuest } from '../../../../lib/auth.js';
import { cancelRoom } from '../../../../services/room-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const guest = await verifyGuest(req);
    const { roomCode } = req.query;

    const result = await cancelRoom(roomCode, guest.id);

    return sendSuccess(res, result, { message: 'Phòng đã bị hủy' });
  } catch (error) {
    return sendError(res, error, req);
  }
}
