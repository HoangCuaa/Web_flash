// backend/services/guest-service.js
import crypto from 'node:crypto';
import { getSupabase } from '../lib/supabase.js';
import { generateSecureToken, hashToken } from '../lib/auth.js';
import { NotFoundError, UnauthorizedError } from '../lib/errors.js';

export async function createGuest(nickname) {
  const supabase = getSupabase();
  const token = generateSecureToken(32);
  const tokenHash = hashToken(token);

  // Sinh mã khôi phục tùy chọn (16 ký tự dễ đọc)
  const recoveryCode = crypto.randomBytes(8).toString('hex').toUpperCase();
  const recoveryCodeHash = hashToken(recoveryCode);

  const { data: guest, error } = await supabase
    .from('guests')
    .insert({
      nickname,
      token_hash: tokenHash,
      recovery_code_hash: recoveryCodeHash,
    })
    .select('id, nickname, created_at')
    .single();

  if (error) {
    throw new Error(`Không thể tạo khách: ${error.message}`);
  }

  return {
    guestId: guest.id,
    nickname: guest.nickname,
    token, // Chỉ trả về token thô 1 lần duy nhất cho client lưu giữ
    recoveryCode, // Dùng để khôi phục khi đổi thiết bị
    createdAt: guest.created_at,
  };
}

export async function recoverGuest(recoveryCode) {
  const supabase = getSupabase();
  const recoveryCodeHash = hashToken(recoveryCode);

  // Tìm khách bằng hash của mã khôi phục
  const { data: guest, error } = await supabase
    .from('guests')
    .select('id, nickname')
    .eq('recovery_code_hash', recoveryCodeHash)
    .single();

  if (error || !guest) {
    throw new NotFoundError('Mã khôi phục không tồn tại hoặc không chính xác');
  }

  // Cấp token mới an toàn
  const newToken = generateSecureToken(32);
  const newTokenHash = hashToken(newToken);

  const { error: updateError } = await supabase
    .from('guests')
    .update({
      token_hash: newTokenHash,
      last_active_at: new Date().toISOString(),
    })
    .eq('id', guest.id);

  if (updateError) {
    throw new Error('Không thể cấp lại token mới');
  }

  return {
    guestId: guest.id,
    nickname: guest.nickname,
    token: newToken,
  };
}

export async function getGuestProfile(guestId) {
  const supabase = getSupabase();

  const { data: guest, error } = await supabase
    .from('guests')
    .select('id, nickname, created_at, last_active_at')
    .eq('id', guestId)
    .single();

  if (error || !guest) {
    throw new NotFoundError('Không tìm thấy thông tin người chơi');
  }

  // Lấy tổng số trận đã tham gia và điểm cao nhất
  const { data: stats } = await supabase
    .from('attempts')
    .select('score')
    .eq('guest_id', guestId);

  const totalMatches = stats ? stats.length : 0;
  const highestScore = stats && stats.length > 0 ? Math.max(...stats.map((s) => s.score)) : 0;

  return {
    guestId: guest.id,
    nickname: guest.nickname,
    createdAt: guest.created_at,
    totalMatches,
    highestScore,
  };
}

export async function updateGuestNickname(guestId, newNickname) {
  const supabase = getSupabase();
  const trimmed = (newNickname || '').trim();

  if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
    throw new Error('Biệt danh phải từ 2 đến 50 ký tự');
  }

  const { data: updated, error } = await supabase
    .from('guests')
    .update({ nickname: trimmed, last_active_at: new Date().toISOString() })
    .eq('id', guestId)
    .select('id, nickname')
    .single();

  if (error || !updated) {
    throw new Error('Không thể cập nhật tên người chơi');
  }

  // Cập nhật tên trong các phòng người chơi đang tham gia
  await supabase
    .from('room_players')
    .update({ nickname: trimmed })
    .eq('guest_id', guestId);

  return {
    guestId: updated.id,
    nickname: updated.nickname,
  };
}
