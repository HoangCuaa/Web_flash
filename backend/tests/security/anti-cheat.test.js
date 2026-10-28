// backend/tests/security/anti-cheat.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { submitAnswerSchema, validate } from '../../lib/validation.js';
import { verifyAdmin } from '../../lib/auth.js';
import { UnauthorizedError, ForbiddenError } from '../../lib/errors.js';
import { isWithinDeadline } from '../../lib/scoring.js';

describe('Security & Anti-Cheat Tests', () => {
  it('loại bỏ hoàn toàn các trường gian lận điểm (score, is_correct, points) do client gửi', () => {
    const maliciousPayload = {
      questionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      selectedOptionId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      score: 9999, // HACK
      is_correct: true, // HACK
      points_awarded: 5000, // HACK
      streak: 99, // HACK
    };

    const sanitized = validate(submitAnswerSchema, maliciousPayload);

    // Schema chỉ trích xuất các trường được phép: questionId, selectedOptionId, clientTimeTakenMs
    assert.equal(sanitized.score, undefined);
    assert.equal(sanitized.is_correct, undefined);
    assert.equal(sanitized.points_awarded, undefined);
    assert.equal(sanitized.streak, undefined);
  });

  it('từ chối nộp bài khi đã vượt quá thời hạn (deadline)', () => {
    const deadline = new Date('2026-10-28T12:00:20Z');
    const lateSubmit = new Date('2026-10-28T12:00:23Z'); // trễ 3s

    const allowed = isWithinDeadline(deadline, lateSubmit, 1500);
    assert.equal(allowed, false);
  });

  it('bảo vệ endpoint admin chống bypass khi thiếu hoặc sai x-admin-key', () => {
    process.env.ADMIN_SECRET = 'super-secret-admin-token-1234567890';

    // Trường hợp 1: Không có header
    const reqMissing = { headers: {} };
    assert.throws(() => verifyAdmin(reqMissing), UnauthorizedError);

    // Trường hợp 2: Sai header key
    const reqWrong = { headers: { 'x-admin-key': 'attacker-random-guess' } };
    assert.throws(() => verifyAdmin(reqWrong), ForbiddenError);

    // Trường hợp 3: Đúng header key
    const reqValid = { headers: { 'x-admin-key': 'super-secret-admin-token-1234567890' } };
    assert.doesNotThrow(() => verifyAdmin(reqValid));
  });
});
