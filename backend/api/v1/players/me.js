// backend/api/v1/players/me.js
import { handleCors, sendSuccess, sendError } from '../../../lib/http.js';
import { verifyGuest } from '../../../lib/auth.js';
import { getGuestProfile, updateGuestNickname } from '../../../services/guest-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const guest = await verifyGuest(req);
      const nickname = req.body?.nickname;
      const updated = await updateGuestNickname(guest.id, nickname);
      return sendSuccess(res, updated, { message: 'Đổi tên thành công' });
    } catch (error) {
      return sendError(res, error, req);
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const guest = await verifyGuest(req);
    const profile = await getGuestProfile(guest.id);

    return sendSuccess(res, profile);
  } catch (error) {
    return sendError(res, error, req);
  }
}
