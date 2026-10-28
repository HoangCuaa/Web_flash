// backend/tests/unit/auth.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateSecureToken, hashToken, generateRoomCode, verifyHost } from '../../lib/auth.js';
import { ForbiddenError } from '../../lib/errors.js';

describe('Auth & Cryptography Unit Tests', () => {
  it('sinh token ngẫu nhiên có độ dài và entropy mạnh', () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);

    assert.equal(token1.length, 64); // 32 bytes hex = 64 ký tự
    assert.equal(token2.length, 64);
    assert.notEqual(token1, token2);
  });

  it('băm SHA-256 nhất quán và một chiều', () => {
    const rawToken = 'my-secret-test-token-12345';
    const hash1 = hashToken(rawToken);
    const hash2 = hashToken(rawToken);

    assert.equal(hash1.length, 64);
    assert.equal(hash1, hash2);
    assert.notEqual(hash1, rawToken);
  });

  it('sinh room code 6 ký tự không chứa ký tự dễ nhầm lẫn (0, O, 1, I)', () => {
    const ambiguousChars = ['0', 'O', '1', 'I'];
    for (let i = 0; i < 50; i++) {
      const code = generateRoomCode(6);
      assert.equal(code.length, 6);
      for (const char of ambiguousChars) {
        assert.equal(code.includes(char), false);
      }
    }
  });

  it('chặn người chơi không phải host thực hiện quyền host', () => {
    const hostGuest = { id: 'host-uuid-1' };
    const normalPlayer = { id: 'player-uuid-2' };
    const room = { host_guest_id: 'host-uuid-1' };

    assert.doesNotThrow(() => verifyHost(hostGuest, room));
    assert.throws(() => verifyHost(normalPlayer, room), ForbiddenError);
  });
});
