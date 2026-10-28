// backend/tests/unit/scoring.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateScore, isWithinDeadline } from '../../lib/scoring.js';

describe('Scoring & Speed Bonus Unit Tests', () => {
  const startTime = new Date('2026-10-28T10:00:00Z');
  const deadlineTime = new Date('2026-10-28T10:00:20Z'); // 20s window

  it('trả về 0 điểm nếu câu trả lời sai', () => {
    const result = calculateScore({
      basePoints: 100,
      isCorrect: false,
      startTime,
      deadlineTime,
      submitTime: new Date('2026-10-28T10:00:05Z'),
      currentStreak: 5,
    });

    assert.equal(result.isCorrect, false);
    assert.equal(result.totalPoints, 0);
    assert.equal(result.newStreak, 0);
  });

  it('tính đúng điểm cơ bản và điểm thưởng tốc độ tối đa khi nộp ngay lập tức', () => {
    const result = calculateScore({
      basePoints: 100,
      isCorrect: true,
      startTime,
      deadlineTime,
      submitTime: startTime, // nộp tại 0s
      currentStreak: 0,
    });

    assert.equal(result.isCorrect, true);
    assert.equal(result.basePointsAwarded, 100);
    assert.equal(result.speedBonus, 50); // tối đa 50 điểm
    assert.equal(result.totalPoints, 150);
    assert.equal(result.newStreak, 1);
  });

  it('tính đúng điểm thưởng tốc độ tương ứng 50% thời gian', () => {
    const halfTime = new Date('2026-10-28T10:00:10Z'); // 10s trôi qua, còn 10s
    const result = calculateScore({
      basePoints: 100,
      isCorrect: true,
      startTime,
      deadlineTime,
      submitTime: halfTime,
      currentStreak: 1,
    });

    assert.equal(result.isCorrect, true);
    assert.equal(result.speedBonus, 25); // 50% của 50 điểm
    assert.equal(result.totalPoints, 125);
    assert.equal(result.newStreak, 2);
  });

  it('cộng streak bonus 10 điểm khi đạt chuỗi >= 3 câu đúng', () => {
    const result = calculateScore({
      basePoints: 100,
      isCorrect: true,
      startTime,
      deadlineTime,
      submitTime: new Date('2026-10-28T10:00:20Z'), // sát deadline -> 0 bonus tốc độ
      currentStreak: 2, // câu này đúng sẽ lên streak 3
    });

    assert.equal(result.newStreak, 3);
    assert.equal(result.streakBonus, 10);
    assert.equal(result.totalPoints, 110);
  });

  it('kiểm tra deadline với grace period 1.5 giây', () => {
    const onTime = new Date('2026-10-28T10:00:19Z');
    const withinGrace = new Date('2026-10-28T10:00:21Z'); // trễ 1s, dưới 1.5s grace
    const expired = new Date('2026-10-28T10:00:22Z'); // trễ 2s

    assert.equal(isWithinDeadline(deadlineTime, onTime, 1500), true);
    assert.equal(isWithinDeadline(deadlineTime, withinGrace, 1500), true);
    assert.equal(isWithinDeadline(deadlineTime, expired, 1500), false);
  });
});
