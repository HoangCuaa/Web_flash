// backend/lib/scoring.js

/**
 * Tính điểm cơ bản và điểm thưởng tốc độ theo công thức chuẩn:
 * - basePoints: điểm của câu hỏi (mặc định 100)
 * - isCorrect: kết quả đúng/sai
 * - startTime: thời điểm bắt đầu câu hỏi (Date hoặc ms)
 * - deadlineTime: thời điểm hết giờ câu hỏi (Date hoặc ms)
 * - submitTime: thời điểm server nhận bài (Date hoặc ms)
 * - currentStreak: chuỗi đúng hiện tại
 */
export function calculateScore({
  basePoints = 100,
  isCorrect = false,
  startTime,
  deadlineTime,
  submitTime = new Date(),
  currentStreak = 0,
}) {
  if (!isCorrect) {
    return {
      isCorrect: false,
      basePointsAwarded: 0,
      speedBonus: 0,
      streakBonus: 0,
      totalPoints: 0,
      newStreak: 0,
    };
  }

  const startMs = new Date(startTime).getTime();
  const deadlineMs = new Date(deadlineTime).getTime();
  const submitMs = new Date(submitTime).getTime();

  let speedBonus = 0;
  const totalWindowMs = deadlineMs - startMs;
  const timeRemainingMs = deadlineMs - submitMs;

  if (totalWindowMs > 0 && timeRemainingMs > 0) {
    // Tối đa 50 điểm thưởng tốc độ dựa trên tỉ lệ thời gian còn lại
    speedBonus = Math.min(50, Math.max(0, Math.round((timeRemainingMs / totalWindowMs) * 50)));
  }

  const newStreak = currentStreak + 1;
  // Thưởng streak: từ streak 3 trở lên, mỗi câu đúng cộng thêm 10 điểm
  const streakBonus = newStreak >= 3 ? 10 : 0;

  const totalPoints = basePoints + speedBonus + streakBonus;

  return {
    isCorrect: true,
    basePointsAwarded: basePoints,
    speedBonus,
    streakBonus,
    totalPoints,
    newStreak,
  };
}

/**
 * Kiểm tra xem thời điểm nộp bài có nằm trong khoảng hợp lệ không (+ grace period)
 */
export function isWithinDeadline(deadlineTime, submitTime = new Date(), gracePeriodMs = 1500) {
  const deadlineMs = new Date(deadlineTime).getTime();
  const submitMs = new Date(submitTime).getTime();
  return submitMs <= deadlineMs + gracePeriodMs;
}
