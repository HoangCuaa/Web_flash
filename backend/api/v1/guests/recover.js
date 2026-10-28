// backend/api/v1/guests/recover.js
import { handleCors, sendSuccess, sendError } from '../../../lib/http.js';
import { validate, recoverGuestSchema } from '../../../lib/validation.js';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit.js';
import { recoverGuest } from '../../../services/guest-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const ip = getClientIp(req);
    // Chống brute-force recovery code
    checkRateLimit(`guest_recover_${ip}`, 10, 60);

    const { recoveryCode } = validate(recoverGuestSchema, req.body);
    const result = await recoverGuest(recoveryCode);

    return sendSuccess(res, result, { message: 'Khôi phục danh tính thành công' });
  } catch (error) {
    return sendError(res, error, req);
  }
}
