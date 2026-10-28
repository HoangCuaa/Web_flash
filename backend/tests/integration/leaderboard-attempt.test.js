// backend/tests/integration/leaderboard-attempt.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGuest, updateGuestNickname } from '../../services/guest-service.js';
import { savePlayerAttempt, getPlayerHistory } from '../../services/history-service.js';
import { getGlobalLeaderboard, getDailyLeaderboard } from '../../services/leaderboard-service.js';

describe('Leaderboard & Player Attempt History Tests', () => {
  it('lưu kết quả lượt thi kèm thời gian làm bài, tính đúng thứ hạng và hiển thị trên bảng xếp hạng', async () => {
    // 1. Tạo guest
    const guest = await createGuest('TestRacer');
    assert.ok(guest.guestId);

    // 2. Lưu lượt thi của người chơi với thời gian làm bài 42 giây
    const attempt = await savePlayerAttempt(guest.guestId, {
      quizId: '11111111-1111-1111-1111-111111111111',
      score: 480,
      totalCorrect: 4,
      totalQuestions: 4,
      durationSeconds: 42,
    });

    assert.ok(attempt.id);
    assert.equal(attempt.score, 480);
    assert.equal(attempt.total_correct, 4);
    assert.equal(attempt.durationSeconds, 42);

    // 3. Kiểm tra lịch sử thi cá nhân
    const history = await getPlayerHistory(guest.guestId);
    assert.ok(history.items.length >= 1);
    assert.equal(history.items[0].score, 480);

    // 4. Kiểm tra bảng xếp hạng toàn cầu
    const globalLb = await getGlobalLeaderboard(1, 10);
    assert.ok(globalLb.items.length > 0);
    const myEntry = globalLb.items.find((item) => item.nickname === 'TestRacer');
    assert.ok(myEntry, 'Người chơi phải có mặt trên bảng xếp hạng toàn cầu');
    assert.equal(myEntry.score, 480);
    assert.equal(myEntry.durationSeconds, 42);

    // 5. Đổi tên người chơi và kiểm tra bảng xếp hạng tự cập nhật tên mới
    await updateGuestNickname(guest.guestId, 'ChampionRacer');
    const updatedLb = await getGlobalLeaderboard(1, 10);
    const renamedEntry = updatedLb.items.find((item) => item.nickname === 'ChampionRacer');
    assert.ok(renamedEntry, 'Bảng xếp hạng phải tự động cập nhật tên mới của người chơi');
    assert.equal(renamedEntry.score, 480);
  });
});
