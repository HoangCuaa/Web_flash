// backend/api/v1/guests/index.js
import { handleCors, sendSuccess, sendError } from '../../../lib/http.js';
import { validate, createGuestSchema } from '../../../lib/validation.js';
import { checkRateLimit, getClientIp } from '../../../lib/rate-limit.js';
import { createGuest } from '../../../services/guest-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const ip = getClientIp(req);
    checkRateLimit(`guest_create_${ip}`, 30, 60);

    const { nickname } = validate(createGuestSchema, req.body);
    const guestData = await createGuest(nickname);

    return sendSuccess(res, guestData, { message: 'Tạo tài khoản khách thành công' }, 201);
  } catch (error) {
    return sendError(res, error, req);
  }
}
