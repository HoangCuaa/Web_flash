// backend/lib/auth.js
import crypto from 'node:crypto';
import { getSupabase } from './supabase.js';
import { UnauthorizedError, ForbiddenError } from './errors.js';

/**
 * Sinh chuỗi ngẫu nhiên an toàn mã hóa làm token định danh người dùng
 */
export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Băm token bằng thuật toán SHA-256 để lưu trữ an toàn trong Database
 */
export function hashToken(token) {
  if (!token || typeof token !== 'string') return '';
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Sinh mã phòng ngắn gồm 6 ký tự không gây nhầm lẫn (bỏ O, 0, I, 1)
 */
export function generateRoomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

/**
 * Trích xuất token từ Authorization Header hoặc header x-guest-token
 */
export function extractToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['x-guest-token'];
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return authHeader.trim();
}

/**
 * Xác minh Guest Token từ Database
 */
export async function verifyGuest(req) {
  const token = extractToken(req);
  if (!token) {
    throw new UnauthorizedError('Thiếu Guest Token xác thực (Authorization header hoặc x-guest-token)');
  }

  const tokenHash = hashToken(token);
  const supabase = getSupabase();

  const { data: guest, error } = await supabase
    .from('guests')
    .select('id, nickname, created_at, last_active_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !guest) {
    throw new UnauthorizedError('Token không hợp lệ hoặc đã hết hạn');
  }

  // Cập nhật last_active_at không đồng bộ
  supabase
    .from('guests')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', guest.id)
    .then(() => {});

  return guest;
}

/**
 * Xác minh quyền Host của phòng
 */
export function verifyHost(guest, room) {
  if (!room || !guest) {
    throw new ForbiddenError('Không tìm thấy thông tin phòng hoặc người chơi');
  }

  if (room.host_guest_id !== guest.id) {
    throw new ForbiddenError('Chỉ chủ phòng (Host) mới có quyền thực hiện thao tác này');
  }
  return true;
}

/**
 * Xác minh quyền Admin bằng x-admin-key với so sánh an toàn thời gian (timingSafeEqual)
 */
export function verifyAdmin(req) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    throw new ForbiddenError('Hệ thống chưa cấu hình ADMIN_SECRET');
  }

  const providedKey = req.headers['x-admin-key'];
  if (!providedKey || typeof providedKey !== 'string') {
    throw new UnauthorizedError('Yêu cầu khóa quản trị x-admin-key');
  }

  const secretBuffer = Buffer.from(adminSecret);
  const providedBuffer = Buffer.from(providedKey);

  if (secretBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(secretBuffer, providedBuffer)) {
    throw new ForbiddenError('Khóa quản trị x-admin-key không hợp lệ');
  }

  return true;
}
