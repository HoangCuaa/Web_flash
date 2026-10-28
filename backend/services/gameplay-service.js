// backend/services/gameplay-service.js
import { getSupabase } from '../lib/supabase.js';
import { getRoomByCode } from './room-service.js';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  DeadlineExceededError,
} from '../lib/errors.js';

export async function getCurrentQuestion(roomCode, guestId) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  if (room.status !== 'in_progress') {
    return {
      status: room.status,
      question: null,
      message: 'Trận đấu chưa bắt đầu hoặc đã kết thúc',
    };
  }

  // Lấy câu hỏi hiện tại theo index
  const { data: question, error: qError } = await supabase
    .from('room_questions')
    .select('id, content, question_type, points, time_limit_seconds, order_index')
    .eq('room_id', room.id)
    .eq('order_index', room.currentQuestionIndex)
    .single();

  if (qError || !question) {
    throw new NotFoundError('Không tìm thấy câu hỏi hiện tại');
  }

  // Lấy danh sách lựa chọn (TUYỆT ĐỐI KHÔNG chọn trường is_correct)
  const { data: options, error: optError } = await supabase
    .from('room_question_options')
    .select('id, content, order_index')
    .eq('room_question_id', question.id)
    .order('order_index', { ascending: true });

  if (optError) {
    throw new Error('Lỗi truy vấn danh sách đáp án');
  }

  // Kiểm tra người chơi đã nộp bài cho câu này chưa
  let hasSubmitted = false;
  if (guestId) {
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id, selected_option_id')
      .eq('room_question_id', question.id)
      .filter('attempt_id', 'in', `(SELECT id FROM attempts WHERE room_id = '${room.id}' AND guest_id = '${guestId}')`)
      .maybeSingle();

    if (existingAnswer) {
      hasSubmitted = true;
    }
  }

  // Lấy deadline từ phòng
  const { data: roomTimes } = await supabase
    .from('rooms')
    .select('question_started_at, question_deadline_at')
    .eq('id', room.id)
    .single();

  return {
    status: room.status,
    questionIndex: question.order_index,
    totalQuestions: room.totalQuestions,
    question: {
      id: question.id,
      content: question.content,
      type: question.question_type,
      points: question.points,
      timeLimitSeconds: question.time_limit_seconds,
      options: options || [],
    },
    timing: {
      startedAt: roomTimes?.question_started_at,
      deadlineAt: roomTimes?.question_deadline_at,
    },
    hasSubmitted,
  };
}

export async function submitAnswer(
  roomCode,
  guestId,
  { questionId, selectedOptionId, clientTimeTakenMs = 0 },
  idempotencyKey = null
) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  // 1. Kiểm tra Idempotency nếu client có gửi header Idempotency-Key
  if (idempotencyKey) {
    const { data: cached } = await supabase
      .from('idempotency_keys')
      .select('response_status, response_body')
      .eq('key', idempotencyKey)
      .maybeSingle();

    if (cached) {
      return cached.response_body;
    }
  }

  // 2. Gọi Stored Procedure nguyên tử để kiểm tra deadline và chấm điểm
  const { data, error } = await supabase.rpc('submit_answer_atomic', {
    p_room_id: room.id,
    p_guest_id: guestId,
    p_room_question_id: questionId,
    p_selected_option_id: selectedOptionId || null,
    p_client_time_taken_ms: clientTimeTakenMs,
  });

  if (error) {
    throw new Error(`Lỗi nộp bài: ${error.message}`);
  }

  if (!data.success) {
    switch (data.error) {
      case 'ROOM_NOT_PLAYING':
        throw new ConflictError('Phòng hiện không trong thời gian làm bài', 'ROOM_NOT_PLAYING');
      case 'DEADLINE_EXCEEDED':
        throw new DeadlineExceededError('Đã hết thời gian làm bài cho câu hỏi này');
      case 'DUPLICATE_SUBMISSION':
        throw new ConflictError('Bạn đã nộp đáp án cho câu hỏi này rồi', 'DUPLICATE_SUBMISSION');
      case 'INVALID_QUESTION':
        throw new ConflictError('Câu hỏi không khớp với câu hỏi hiện tại của phòng', 'INVALID_QUESTION');
      default:
        throw new Error(data.error);
    }
  }

  // 3. Lưu Idempotency record nếu có key
  if (idempotencyKey) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('idempotency_keys').insert({
      key: idempotencyKey,
      response_status: 200,
      response_body: data,
      expires_at: expiresAt,
    });
  }

  return data;
}

export async function skipQuestion(roomCode, guestId, questionId) {
  return submitAnswer(roomCode, guestId, {
    questionId,
    selectedOptionId: null,
    clientTimeTakenMs: 0,
  });
}

export async function advanceNextQuestion(roomCode, hostGuestId) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  if (room.hostGuestId !== hostGuestId) {
    throw new ForbiddenError('Chỉ chủ phòng mới có quyền chuyển câu hỏi');
  }

  const { data, error } = await supabase.rpc('advance_room_question_atomic', {
    p_room_id: room.id,
    p_host_guest_id: hostGuestId,
  });

  if (error || !data.success) {
    throw new Error(data?.error || error?.message || 'Không thể chuyển câu hỏi');
  }

  return data;
}

export async function getRoomResults(roomCode) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  if (room.status !== 'finished') {
    throw new ConflictError('Kết quả chỉ được công bố sau khi trận đấu hoàn tất', 'ROOM_NOT_FINISHED');
  }

  // Lấy bảng xếp hạng tổng kết
  const { data: leaderboard } = await supabase
    .from('room_players')
    .select('guest_id, nickname, score, streak, correct_answers_count')
    .eq('room_id', room.id)
    .order('score', { ascending: false });

  // Lấy danh sách câu hỏi kèm đáp án đúng và giải thích
  const { data: questions } = await supabase
    .from('room_questions')
    .select(`
      id,
      content,
      order_index,
      explanation,
      points,
      room_question_options (
        id,
        content,
        is_correct,
        order_index
      )
    `)
    .eq('room_id', room.id)
    .order('order_index', { ascending: true });

  return {
    room: {
      id: room.id,
      code: room.code,
      status: room.status,
      totalQuestions: room.totalQuestions,
      startedAt: room.startedAt,
      finishedAt: room.finishedAt,
    },
    leaderboard: leaderboard || [],
    questions: questions || [],
  };
}
