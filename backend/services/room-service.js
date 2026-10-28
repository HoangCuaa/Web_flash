// backend/services/room-service.js
import { getSupabase } from '../lib/supabase.js';
import { generateRoomCode } from '../lib/auth.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../lib/errors.js';

export async function createRoom(hostGuestId, quizId, maxPlayers = 20, timePerQuestion = 20) {
  const supabase = getSupabase();

  // Thử sinh room code ngẫu nhiên không trùng với tối đa 5 lần thử
  let roomCode = '';
  let roomId = null;
  let attempts = 0;

  while (attempts < 5) {
    roomCode = generateRoomCode(6);
    try {
      const { data, error } = await supabase.rpc('create_room_with_snapshot', {
        p_host_guest_id: hostGuestId,
        p_quiz_id: quizId,
        p_code: roomCode,
        p_max_players: maxPlayers,
        p_time_per_question: timePerQuestion,
      });

      if (!error && data) {
        roomId = data;
        break;
      }
      attempts++;
    } catch {
      attempts++;
    }
  }

  if (!roomId) {
    throw new Error('Không thể tạo mã phòng ngẫu nhiên duy nhất, vui lòng thử lại.');
  }

  // Tự động thêm chủ phòng vào danh sách room_players
  const { data: hostGuest } = await supabase
    .from('guests')
    .select('nickname')
    .eq('id', hostGuestId)
    .single();

  await supabase.from('room_players').insert({
    room_id: roomId,
    guest_id: hostGuestId,
    nickname: hostGuest ? hostGuest.nickname : 'Host',
    status: 'joined',
  });

  return {
    roomId,
    roomCode,
    hostGuestId,
    quizId,
    maxPlayers,
    timePerQuestion,
    status: 'waiting',
  };
}

export async function getRoomByCode(roomCode) {
  const supabase = getSupabase();

  const { data: room, error } = await supabase
    .from('rooms')
    .select(`
      id,
      code,
      host_guest_id,
      quiz_id,
      status,
      max_players,
      time_per_question,
      current_question_index,
      total_questions,
      created_at,
      started_at,
      finished_at,
      quizzes (
        title,
        description,
        category
      )
    `)
    .eq('code', roomCode.toUpperCase().trim())
    .single();

  if (error || !room) {
    throw new NotFoundError(`Phòng với mã "${roomCode}" không tồn tại.`);
  }

  // Đếm số người chơi hiện tại
  const { count } = await supabase
    .from('room_players')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', room.id);

  return {
    id: room.id,
    code: room.code,
    hostGuestId: room.host_guest_id,
    quizId: room.quiz_id,
    quiz: room.quizzes,
    status: room.status,
    playerCount: count || 0,
    maxPlayers: room.max_players,
    timePerQuestion: room.time_per_question,
    currentQuestionIndex: room.current_question_index,
    totalQuestions: room.total_questions,
    createdAt: room.created_at,
    startedAt: room.started_at,
    finishedAt: room.finished_at,
  };
}

export async function joinRoom(roomCode, guestId, nickname) {
  const supabase = getSupabase();

  const { data, error } = await supabase.rpc('join_room_atomic', {
    p_room_code: roomCode.toUpperCase().trim(),
    p_guest_id: guestId,
    p_nickname: nickname,
  });

  if (error) {
    throw new Error(`Lỗi tham gia phòng: ${error.message}`);
  }

  if (!data.success) {
    switch (data.error) {
      case 'ROOM_NOT_FOUND':
        throw new NotFoundError('Phòng không tồn tại');
      case 'ROOM_ALREADY_STARTED':
        throw new ConflictError('Trận đấu trong phòng này đã bắt đầu, không thể tham gia nữa', 'ROOM_ALREADY_STARTED');
      case 'ROOM_FULL':
        throw new ConflictError('Phòng đã đủ số lượng người chơi tối đa', 'ROOM_FULL');
      case 'NICKNAME_TAKEN':
        throw new ConflictError('Biệt danh này đã có người sử dụng trong phòng, vui lòng chọn tên khác', 'NICKNAME_TAKEN');
      default:
        throw new Error(data.error);
    }
  }

  return data;
}

export async function setReadyStatus(roomCode, guestId, isReady = true) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  const { data, error } = await supabase
    .from('room_players')
    .update({ status: isReady ? 'ready' : 'joined' })
    .eq('room_id', room.id)
    .eq('guest_id', guestId)
    .select('id, nickname, status')
    .single();

  if (error || !data) {
    throw new NotFoundError('Bạn chưa tham gia phòng này');
  }

  return data;
}

export async function leaveRoom(roomCode, guestId) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  if (room.hostGuestId === guestId) {
    // Nếu host rời phòng khi đang chờ, đánh dấu phòng bị hủy
    if (room.status === 'waiting') {
      await supabase.from('rooms').update({ status: 'cancelled' }).eq('id', room.id);
    }
  }

  await supabase
    .from('room_players')
    .delete()
    .eq('room_id', room.id)
    .eq('guest_id', guestId);

  return { success: true };
}

export async function startRoom(roomCode, hostGuestId) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  if (room.hostGuestId !== hostGuestId) {
    throw new ForbiddenError('Chỉ chủ phòng mới có quyền bắt đầu trận đấu');
  }

  if (room.status !== 'waiting') {
    throw new ConflictError('Trận đấu đã diễn ra hoặc đã kết thúc', 'INVALID_STATUS');
  }

  // Gọi hàm atomic để mở câu hỏi đầu tiên (index 0)
  const { data, error } = await supabase.rpc('advance_room_question_atomic', {
    p_room_id: room.id,
    p_host_guest_id: hostGuestId,
  });

  if (error || !data.success) {
    throw new Error(data?.error || error?.message || 'Không thể bắt đầu trận đấu');
  }

  return data;
}

export async function cancelRoom(roomCode, hostGuestId) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  if (room.hostGuestId !== hostGuestId) {
    throw new ForbiddenError('Chỉ chủ phòng mới có quyền hủy phòng');
  }

  const { error } = await supabase
    .from('rooms')
    .update({ status: 'cancelled' })
    .eq('id', room.id);

  if (error) {
    throw new Error('Không thể hủy phòng');
  }

  return { success: true };
}

export async function getRoomPlayers(roomCode) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  const { data: players, error } = await supabase
    .from('room_players')
    .select('id, guest_id, nickname, status, score, streak, joined_at')
    .eq('room_id', room.id)
    .order('score', { ascending: false });

  if (error) {
    throw new Error('Không thể lấy danh sách người chơi');
  }

  return players;
}

export async function getRoomState(roomCode, guestId) {
  const supabase = getSupabase();
  const room = await getRoomByCode(roomCode);

  // Lấy trạng thái của chính người chơi trong phòng
  const { data: player } = await supabase
    .from('room_players')
    .select('id, nickname, status, score, streak')
    .eq('room_id', room.id)
    .eq('guest_id', guestId)
    .maybeSingle();

  return {
    room: {
      id: room.id,
      code: room.code,
      status: room.status,
      isHost: room.hostGuestId === guestId,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.totalQuestions,
      timePerQuestion: room.timePerQuestion,
      startedAt: room.startedAt,
      finishedAt: room.finishedAt,
    },
    player: player || null,
  };
}
