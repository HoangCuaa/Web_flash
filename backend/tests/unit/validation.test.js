// backend/tests/unit/validation.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeNickname,
  createGuestSchema,
  createRoomSchema,
  submitAnswerSchema,
  validate,
} from '../../lib/validation.js';
import { ValidationError } from '../../lib/errors.js';

describe('Validation Unit Tests', () => {
  it('chuẩn hóa nickname Unicode và loại bỏ ký tự điều khiển ẩn', () => {
    const raw = '  Nguyễn Văn A\u0000\u0007  ';
    const cleaned = sanitizeNickname(raw);
    assert.equal(cleaned, 'Nguyễn Văn A');
  });

  it('từ chối nickname quá ngắn hoặc rỗng', () => {
    assert.throws(() => validate(createGuestSchema, { nickname: ' ' }), ValidationError);
    assert.throws(() => validate(createGuestSchema, { nickname: 'A' }), ValidationError);
  });

  it('chấp nhận nickname hợp lệ từ 2 đến 50 ký tự', () => {
    const valid = validate(createGuestSchema, { nickname: 'ProGamer99' });
    assert.equal(valid.nickname, 'ProGamer99');
  });

  it('kiểm tra ràng buộc tạo phòng', () => {
    // Thiếu quizId hợp lệ
    assert.throws(
      () =>
        validate(createRoomSchema, {
          quizId: 'invalid-uuid',
          maxPlayers: 10,
        }),
      ValidationError
    );

    // maxPlayers vượt quá giới hạn
    assert.throws(
      () =>
        validate(createRoomSchema, {
          quizId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          maxPlayers: 200, // vượt quá 100
        }),
      ValidationError
    );
  });

  it('kiểm tra dữ liệu nộp câu trả lời hợp lệ', () => {
    const valid = validate(submitAnswerSchema, {
      questionId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      selectedOptionId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      clientTimeTakenMs: 4500,
    });
    assert.equal(valid.questionId, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  });
});
