// backend/api/v1/rooms/[roomCode]/state.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { extractToken, hashToken } from '../../../../lib/auth.js';
import { getSupabase } from '../../../../lib/supabase.js';
import { getRoomState } from '../../../../services/room-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const { roomCode } = req.query;

    // Lấy guestId nếu có token kèm theo (cho phép reconnect)
    let guestId = null;
    const token = extractToken(req);
    if (token) {
      const supabase = getSupabase();
      const tokenHash = hashToken(token);
      const { data } = await supabase.from('guests').select('id').eq('token_hash', tokenHash).maybeSingle();
      if (data) guestId = data.id;
    }

    const state = await getRoomState(roomCode, guestId);

    return sendSuccess(res, state);
  } catch (error) {
    return sendError(res, error, req);
  }
}
