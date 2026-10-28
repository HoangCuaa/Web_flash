// backend/lib/rate-limit.js
import { RateLimitError } from './errors.js';

// Bộ nhớ đệm tạm thời cho rate-limiting theo từng instance serverless
const memoryStore = new Map();

/**
 * Kiểm tra giới hạn tần suất request (Rate Limiter)
 * @param {string} key Định danh nguồn gọi (IP hoặc Guest ID)
 * @param {number} maxRequests Số request tối đa cho phép trong window
 * @param {number} windowSeconds Khoảng thời gian tính bằng giây
 */
export function checkRateLimit(key, maxRequests = 60, windowSeconds = 60) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const record = memoryStore.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  memoryStore.set(key, record);

  // Dọn dẹp định kỳ
  if (memoryStore.size > 5000) {
    for (const [k, v] of memoryStore.entries()) {
      if (now > v.resetTime) memoryStore.delete(k);
    }
  }

  if (record.count > maxRequests) {
    throw new RateLimitError(
      `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil((record.resetTime - now) / 1000)} giây.`
    );
  }

  return {
    remaining: Math.max(0, maxRequests - record.count),
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}

export function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
}
