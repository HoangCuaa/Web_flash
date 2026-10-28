// backend/api/v1/rooms/[roomCode]/current-question.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { extractToken, hashToken } from '../../../../lib/auth.js';
import { getSupabase } from '../../../../lib/supabase.js';
import { getCurrentQuestion } from '../../../../services/gameplay-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const { roomCode } = req.query;

    let guestId = null;
    const token = extractToken(req);
    if (token) {
      const supabase = getSupabase();
      const tokenHash = hashToken(token);
      const { data } = await supabase.from('guests').select('id').eq('token_hash', tokenHash).maybeSingle();
      if (data) guestId = data.id;
    }

    const questionData = await getCurrentQuestion(roomCode, guestId);

    return sendSuccess(res, questionData);
  } catch (error) {
    return sendError(res, error, req);
  }
}
