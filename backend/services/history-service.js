// backend/services/history-service.js
import { getSupabase } from '../lib/supabase.js';
import { NotFoundError, ForbiddenError } from '../lib/errors.js';

export async function getPlayerHistory(guestId, page = 1, limit = 20) {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  const { data: attempts, count, error } = await supabase
    .from('attempts')
    .select(`
      id,
      room_id,
      quiz_id,
      score,
      total_correct,
      total_questions,
      final_rank,
      started_at,
      finished_at,
      quizzes (
        title,
        category
      ),
      rooms (
        code
      )
    `, { count: 'exact' })
    .eq('guest_id', guestId)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error('Lỗi lấy lịch sử thi của người chơi');
  }

  const items = (attempts || []).map((att) => ({
    attemptId: att.id,
    roomCode: att.rooms?.code,
    quizTitle: att.quizzes?.title || 'Bộ câu hỏi tùy chọn',
    category: att.quizzes?.category || 'Chung',
    score: att.score,
    totalCorrect: att.total_correct,
    totalQuestions: att.total_questions,
    rank: att.final_rank,
    startedAt: att.started_at,
    finishedAt: att.finished_at,
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

export async function savePlayerAttempt(guestId, { quizId, score, totalCorrect, totalQuestions, durationSeconds = 0, roomCode = null }) {
  const supabase = getSupabase();
  const finishedAt = new Date().toISOString();
  const startedAt = new Date(Date.now() - Math.max(1, durationSeconds || 10) * 1000).toISOString();

  let roomId = null;
  if (roomCode) {
    const { data: room } = await supabase.from('rooms').select('id').eq('code', roomCode).maybeSingle();
    if (room) roomId = room.id;
  }

  // Lấy nickname hiện tại của khách
  const { data: guest } = await supabase.from('guests').select('nickname').eq('id', guestId).maybeSingle();
  const nickname = guest?.nickname || 'Người chơi';

  const { data: attempt, error } = await supabase
    .from('attempts')
    .insert({
      guest_id: guestId,
      quiz_id: quizId || null,
      room_id: roomId || null,
      score: score || 0,
      total_correct: totalCorrect || 0,
      total_questions: totalQuestions || 4,
      started_at: startedAt,
      finished_at: finishedAt,
      guests: { nickname },
    })
    .select('id, score, total_correct, total_questions, started_at, finished_at')
    .single();

  if (error) {
    throw new Error(`Lỗi lưu kết quả thi: ${error.message}`);
  }

  return {
    ...attempt,
    nickname,
    durationSeconds: durationSeconds || Math.round((new Date(finishedAt) - new Date(startedAt)) / 1000),
  };
}

export async function getAttemptDetail(guestId, attemptId) {
  const supabase = getSupabase();

  // 1. Kiểm tra quyền sở hữu lượt thi
  const { data: attempt, error } = await supabase
    .from('attempts')
    .select(`
      id,
      guest_id,
      room_id,
      quiz_id,
      score,
      total_correct,
      total_questions,
      final_rank,
      started_at,
      finished_at,
      quizzes (
        title
      )
    `)
    .eq('id', attemptId)
    .single();

  if (error || !attempt) {
    throw new NotFoundError('Không tìm thấy lượt thi');
  }

  if (attempt.guest_id !== guestId) {
    throw new ForbiddenError('Bạn không có quyền xem chi tiết lượt thi của người chơi khác');
  }

  // 2. Lấy chi tiết các câu trả lời kèm giải thích
  const { data: answers, error: aError } = await supabase
    .from('answers')
    .select(`
      id,
      is_correct,
      points_awarded,
      time_taken_ms,
      answered_at,
      selected_option_id,
      room_questions (
        id,
        content,
        question_type,
        explanation,
        order_index
      ),
      room_question_options (
        id,
        content
      )
    `)
    .eq('attempt_id', attemptId);

  if (aError) {
    throw new Error('Không thể lấy chi tiết câu trả lời');
  }

  return {
    attempt: {
      id: attempt.id,
      quizTitle: attempt.quizzes?.title,
      score: attempt.score,
      totalCorrect: attempt.total_correct,
      totalQuestions: attempt.total_questions,
      rank: attempt.final_rank,
      startedAt: attempt.started_at,
      finishedAt: attempt.finished_at,
    },
    answers: answers || [],
  };
}
