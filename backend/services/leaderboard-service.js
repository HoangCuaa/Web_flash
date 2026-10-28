// backend/services/leaderboard-service.js
import { getSupabase } from '../lib/supabase.js';
import { getRoomByCode } from './room-service.js';

export async function getRoomLeaderboard(roomCode) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  const { data: players, error } = await supabase
    .from('room_players')
    .select('id, guest_id, nickname, score, streak, correct_answers_count')
    .eq('room_id', room.id)
    .order('score', { ascending: false })
    .order('correct_answers_count', { ascending: false });

  if (error) {
    throw new Error('Không thể lấy bảng xếp hạng phòng');
  }

  // Gán rank 1, 2, 3...
  const ranked = (players || []).map((p, idx) => ({
    rank: idx + 1,
    nickname: p.nickname,
    score: p.score,
    streak: p.streak,
    correctCount: p.correct_answers_count,
  }));

  return ranked;
}

export async function getQuizLeaderboard(quizId, page = 1, limit = 20) {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  // Lấy điểm cao nhất của từng người chơi đối với quiz này
  const { data, count, error } = await supabase
    .from('attempts')
    .select(`
      id,
      score,
      total_correct,
      total_questions,
      finished_at,
      guests (
        nickname
      )
    `, { count: 'exact' })
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error('Lỗi lấy bảng xếp hạng quiz');
  }

  const items = (data || []).map((item, idx) => ({
    rank: offset + idx + 1,
    nickname: item.guests?.nickname || 'Ẩn danh',
    score: item.score,
    totalCorrect: item.total_correct,
    totalQuestions: item.total_questions,
    finishedAt: item.finished_at,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

export async function getGlobalLeaderboard(page = 1, limit = 20) {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  // Xếp hạng dựa trên tổng điểm các lượt thi hợp lệ của người chơi
  const { data, count, error } = await supabase
    .from('attempts')
    .select(`
      id,
      guest_id,
      score,
      total_correct,
      total_questions,
      started_at,
      finished_at,
      guests (
        nickname
      )
    `, { count: 'exact' })
    .order('score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error('Lỗi lấy bảng xếp hạng toàn cầu');
  }

  const items = (data || []).map((item, idx) => {
    let durationSeconds = 0;
    if (item.started_at && item.finished_at) {
      durationSeconds = Math.max(1, Math.round((new Date(item.finished_at) - new Date(item.started_at)) / 1000));
    }
    return {
      rank: offset + idx + 1,
      guestId: item.guest_id,
      nickname: item.guests?.nickname || 'Ẩn danh',
      score: item.score,
      totalCorrect: item.total_correct,
      totalQuestions: item.total_questions || 4,
      durationSeconds,
      finishedAt: item.finished_at,
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}

export async function getDailyLeaderboard(page = 1, limit = 20) {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  // Lấy từ 00:00 UTC hôm nay
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data, count, error } = await supabase
    .from('attempts')
    .select(`
      id,
      guest_id,
      score,
      total_correct,
      total_questions,
      started_at,
      finished_at,
      guests (
        nickname
      )
    `, { count: 'exact' })
    .gte('finished_at', todayStart.toISOString())
    .order('score', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error('Lỗi lấy bảng xếp hạng trong ngày');
  }

  const items = (data || []).map((item, idx) => {
    let durationSeconds = 0;
    if (item.started_at && item.finished_at) {
      durationSeconds = Math.max(1, Math.round((new Date(item.finished_at) - new Date(item.started_at)) / 1000));
    }
    return {
      rank: offset + idx + 1,
      guestId: item.guest_id,
      nickname: item.guests?.nickname || 'Ẩn danh',
      score: item.score,
      totalCorrect: item.total_correct,
      totalQuestions: item.total_questions || 4,
      durationSeconds,
      finishedAt: item.finished_at,
    };
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  };
}
