// backend/tests/integration/room-multiplayer.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGuest } from '../../services/guest-service.js';
import { createRoom, joinRoom, getRoomPlayers, startRoom, getRoomState } from '../../services/room-service.js';
import { submitAnswer } from '../../services/gameplay-service.js';

describe('Multiplayer Room End-to-End Flow Tests', () => {
  it('hỗ trợ tạo phòng, nhiều người chơi tham gia, hiển thị danh sách người chơi và bắt đầu trận đấu', async () => {
    // 1. Tạo 2 tài khoản khách
    const hostUser = await createGuest('vcd');
    const playerUser = await createGuest('Player_5127');

    assert.ok(hostUser.guestId);
    assert.equal(hostUser.nickname, 'vcd');
    assert.ok(playerUser.guestId);
    assert.equal(playerUser.nickname, 'Player_5127');

    // 2. Host vcd tạo phòng
    const room = await createRoom(hostUser.guestId, '11111111-1111-1111-1111-111111111111', 20, 20);
    assert.ok(room.roomCode);
    assert.equal(room.status, 'waiting');

    // 3. Player_5127 tham gia phòng qua roomCode
    const joinResult = await joinRoom(room.roomCode, playerUser.guestId, playerUser.nickname);
    assert.ok(joinResult.success);

    // 4. Lấy danh sách người chơi trong phòng -> phải đủ 2 người: vcd và Player_5127
    const players = await getRoomPlayers(room.roomCode);
    assert.equal(players.length, 2);
    const nicknames = players.map((p) => p.nickname);
    assert.ok(nicknames.includes('vcd'));
    assert.ok(nicknames.includes('Player_5127'));

    // 5. Host vcd bấm bắt đầu trận đấu
    const startResult = await startRoom(room.roomCode, hostUser.guestId);
    assert.ok(startResult.success);
    assert.equal(startResult.status, 'in_progress');

    // 6. Kiểm tra trạng thái phòng của từng người chơi
    const hostState = await getRoomState(room.roomCode, hostUser.guestId);
    assert.equal(hostState.room.status, 'in_progress');

    const playerState = await getRoomState(room.roomCode, playerUser.guestId);
    assert.equal(playerState.room.status, 'in_progress');

    // 7. Người chơi nộp đáp án
    const answerResult = await submitAnswer(
      room.roomCode,
      playerUser.guestId,
      {
        questionId: 'q1',
        selectedOptionId: 'opt3', // String là đáp án đúng
        clientTimeTakenMs: 2500,
      }
    );
    assert.ok(answerResult.success);
    assert.equal(answerResult.is_correct, true);
    assert.ok(answerResult.points_awarded > 100);
  });
});
