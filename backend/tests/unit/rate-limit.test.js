// backend/tests/unit/rate-limit.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from '../../lib/rate-limit.js';
import { RateLimitError } from '../../lib/errors.js';

describe('Rate Limiter Unit Tests', () => {
  it('cho phép request trong hạn mức quy định', () => {
    const key = `test_ip_${Date.now()}`;
    const result1 = checkRateLimit(key, 5, 10);
    assert.equal(result1.remaining, 4);

    const result2 = checkRateLimit(key, 5, 10);
    assert.equal(result2.remaining, 3);
  });

  it('ném lỗi RateLimitError khi vượt quá hạn mức', () => {
    const key = `test_flood_${Date.now()}`;
    // Cho phép tối đa 3 requests
    checkRateLimit(key, 3, 10);
    checkRateLimit(key, 3, 10);
    checkRateLimit(key, 3, 10);

    assert.throws(() => checkRateLimit(key, 3, 10), RateLimitError);
  });
});
