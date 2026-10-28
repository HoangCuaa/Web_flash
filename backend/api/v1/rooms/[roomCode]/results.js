// backend/api/v1/rooms/[roomCode]/results.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { getRoomResults } from '../../../../services/gameplay-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const { roomCode } = req.query;
    const results = await getRoomResults(roomCode);

    return sendSuccess(res, results);
  } catch (error) {
    return sendError(res, error, req);
  }
}
