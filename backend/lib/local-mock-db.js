// backend/lib/local-mock-db.js
// Giả lập Database trong bộ nhớ khi chạy Local mà chưa kết nối Supabase thật

import crypto from 'node:crypto';

// Dữ liệu mẫu khởi tạo
const mockDb = {
  quizzes: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Kiến thức Web & JavaScript Nền Tảng',
      description: 'Bộ câu hỏi trắc nghiệm ôn tập kiến thức HTML, CSS, JavaScript và HTTP cơ bản.',
      category: 'Lập trình Web',
      time_per_question: 20,
      is_public: true,
      created_at: new Date().toISOString(),
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Kiến thức Mạng Máy Tính & Web Security',
      description: 'Các khái niệm cơ bản về HTTP, HTTPS, CORS, REST API và bảo mật web.',
      category: 'Mạng & Bảo Mật',
      time_per_question: 25,
      is_public: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  questions: [
    {
      id: 'q1',
      quiz_id: '11111111-1111-1111-1111-111111111111',
      content: 'Trong JavaScript, kiểu dữ liệu nào sau đây là kiểu nguyên thủy (primitive)?',
      question_type: 'multiple_choice',
      points: 100,
      explanation: 'String, Number, Boolean, Null, Undefined, Symbol, BigInt là các kiểu nguyên thủy.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'q2',
      quiz_id: '11111111-1111-1111-1111-111111111111',
      content: 'Mã trạng thái HTTP 404 có ý nghĩa là gì?',
      question_type: 'multiple_choice',
      points: 100,
      explanation: '404 Not Found biểu thị tài nguyên không tìm thấy.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'q3',
      quiz_id: '11111111-1111-1111-1111-111111111111',
      content: 'Giao thức HTTPS mặc định sử dụng cổng (port) nào?',
      question_type: 'multiple_choice',
      points: 100,
      explanation: 'HTTP dùng port 80, HTTPS dùng port 443.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'q4',
      quiz_id: '11111111-1111-1111-1111-111111111111',
      content: 'Toán tử "===" trong JavaScript so sánh cả giá trị và kiểu dữ liệu (Strict equality).',
      question_type: 'true_false',
      points: 100,
      explanation: 'Toán tử === kiểm tra bằng nghiêm ngặt không ép kiểu tự động.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'q5',
      quiz_id: '22222222-2222-2222-2222-222222222222',
      content: 'Cơ chế CORS (Cross-Origin Resource Sharing) được kiểm soát bởi đối tượng nào?',
      question_type: 'multiple_choice',
      points: 100,
      explanation: 'CORS được trình duyệt web thực thi dựa trên các HTTP Header từ server.',
      created_at: new Date().toISOString(),
    },
  ],
  question_options: [
    // q1
    { id: 'opt1', question_id: 'q1', content: 'Object', is_correct: false, order_index: 0 },
    { id: 'opt2', question_id: 'q1', content: 'Array', is_correct: false, order_index: 1 },
    { id: 'opt3', question_id: 'q1', content: 'String', is_correct: true, order_index: 2 },
    { id: 'opt4', question_id: 'q1', content: 'Function', is_correct: false, order_index: 3 },
    // q2
    { id: 'opt5', question_id: 'q2', content: 'Unauthorized', is_correct: false, order_index: 0 },
    { id: 'opt6', question_id: 'q2', content: 'Not Found', is_correct: true, order_index: 1 },
    { id: 'opt7', question_id: 'q2', content: 'Internal Error', is_correct: false, order_index: 2 },
    { id: 'opt8', question_id: 'q2', content: 'Forbidden', is_correct: false, order_index: 3 },
    // q3
    { id: 'opt9', question_id: 'q3', content: '80', is_correct: false, order_index: 0 },
    { id: 'opt10', question_id: 'q3', content: '443', is_correct: true, order_index: 1 },
    { id: 'opt11', question_id: 'q3', content: '8080', is_correct: false, order_index: 2 },
    { id: 'opt12', question_id: 'q3', content: '22', is_correct: false, order_index: 3 },
    // q4
    { id: 'opt13', question_id: 'q4', content: 'Đúng', is_correct: true, order_index: 0 },
    { id: 'opt14', question_id: 'q4', content: 'Sai', is_correct: false, order_index: 1 },
    // q5
    { id: 'opt15', question_id: 'q5', content: 'Trình duyệt web', is_correct: true, order_index: 0 },
    { id: 'opt16', question_id: 'q5', content: 'Hệ điều hành Windows', is_correct: false, order_index: 1 },
    { id: 'opt17', question_id: 'q5', content: 'Phần cứng Router', is_correct: false, order_index: 2 },
  ],
  rooms: [],
  room_players: [],
  room_questions: [],
  room_question_options: [],
  attempts: [
    {
      id: 'att1',
      room_id: 'r1',
      guest_id: 'g1',
      quiz_id: '11111111-1111-1111-1111-111111111111',
      score: 350,
      total_correct: 3,
      total_questions: 4,
      final_rank: 1,
      started_at: new Date(Date.now() - 7200000).toISOString(),
      finished_at: new Date(Date.now() - 7160000).toISOString(),
      guests: { nickname: 'ProGamer99' },
    },
    {
      id: 'att2',
      room_id: 'r1',
      guest_id: 'g2',
      quiz_id: '11111111-1111-1111-1111-111111111111',
      score: 280,
      total_correct: 2,
      total_questions: 4,
      final_rank: 2,
      started_at: new Date(Date.now() - 3600000).toISOString(),
      finished_at: new Date(Date.now() - 3545000).toISOString(),
      guests: { nickname: 'QuizMaster' },
    },
  ],
  guests: [],
  idempotency_keys: [],
};

// Query Builder đơn giản mô phỏng cú pháp Supabase Client
class MockQueryBuilder {
  constructor(tableName) {
    this.table = tableName;
    this.filters = [];
    this.sortField = null;
    this.sortAscending = true;
    this.limitCount = null;
    this.offsetCount = 0;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.isHeadCount = false;
  }

  select(fields = '*', options = {}) {
    if (options && options.head) {
      this.isHeadCount = true;
    }
    return this;
  }

  eq(field, value) {
    this.filters.push((item) => String(item[field]) === String(value));
    return this;
  }

  gte(field, value) {
    this.filters.push((item) => item[field] >= value);
    return this;
  }

  gt(field, value) {
    this.filters.push((item) => item[field] > value);
    return this;
  }

  lte(field, value) {
    this.filters.push((item) => item[field] <= value);
    return this;
  }

  lt(field, value) {
    this.filters.push((item) => item[field] < value);
    return this;
  }

  filter(field, operator, value) {
    return this;
  }

  order(field, options = {}) {
    this.sortField = field;
    this.sortAscending = options.ascending !== false;
    return this;
  }

  range(from, to) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this.execute();
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this.execute();
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    const list = mockDb[this.table] || [];
    let result = [...list];

    // Áp dụng filters
    for (const f of this.filters) {
      result = result.filter(f);
    }

    if (this.isHeadCount) {
      return { data: null, count: result.length, error: null };
    }

    // Áp dụng sắp xếp
    if (this.sortField) {
      result.sort((a, b) => {
        const valA = a[this.sortField];
        const valB = b[this.sortField];
        if (valA < valB) return this.sortAscending ? -1 : 1;
        if (valA > valB) return this.sortAscending ? 1 : -1;
        return 0;
      });
    }

    // Embed relation dữ liệu (questions, question_options, guests)
    if (this.table === 'quizzes') {
      result = result.map((q) => {
        const questions = (mockDb.questions || [])
          .filter((item) => item.quiz_id === q.id)
          .map((item) => {
            const opts = (mockDb.question_options || []).filter((o) => o.question_id === item.id);
            return {
              ...item,
              question_options: opts,
            };
          });
        return {
          ...q,
          questions,
        };
      });
    }

    if (this.table === 'questions') {
      result = result.map((q) => {
        const opts = (mockDb.question_options || []).filter((o) => o.question_id === q.id);
        return {
          ...q,
          question_options: opts,
        };
      });
    }

    if (this.table === 'attempts') {
      result = result.map((att) => {
        const guest = (mockDb.guests || []).find((g) => g.id === att.guest_id);
        const quiz = (mockDb.quizzes || []).find((qz) => qz.id === att.quiz_id);
        const room = (mockDb.rooms || []).find((rm) => rm.id === att.room_id);
        return {
          ...att,
          guests: guest?.nickname ? { nickname: guest.nickname } : (att.guests || { nickname: 'Ẩn danh' }),
          quizzes: att.quizzes || (quiz ? { title: quiz.title, category: quiz.category } : null),
          rooms: att.rooms || (room ? { code: room.code } : null),
        };
      });
    }

    if (this.table === 'rooms') {
      result = result.map((rm) => {
        const quiz = (mockDb.quizzes || []).find((qz) => qz.id === rm.quiz_id);
        return {
          ...rm,
          quizzes: quiz ? { title: quiz.title, description: quiz.description, category: quiz.category } : null,
        };
      });
    }

    // Pagination
    if (this.limitCount !== null) {
      result = result.slice(this.offsetCount, this.offsetCount + this.limitCount);
    }

    if (this.isSingle) {
      if (result.length === 0) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
      }
      return { data: result[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: result[0] || null, error: null };
    }

    return { data: result, count: result.length, error: null };
  }

  insert(data) {
    const items = Array.isArray(data) ? data : [data];
    const inserted = [];

    for (const item of items) {
      const record = {
        id: item.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...item,
      };
      if (!mockDb[this.table]) mockDb[this.table] = [];
      mockDb[this.table].push(record);
      inserted.push(record);
    }

    return {
      select: () => ({
        single: async () => ({ data: inserted[0], error: null }),
        then: (resolve) => resolve({ data: inserted, error: null }),
      }),
      then: (resolve) => resolve({ data: inserted, error: null }),
    };
  }

  update(data) {
    return {
      eq: (field, value) => {
        const list = mockDb[this.table] || [];
        let updatedRecord = null;
        for (const item of list) {
          if (String(item[field]) === String(value)) {
            Object.assign(item, data);
            updatedRecord = item;
          }
        }
        return {
          select: () => ({
            single: async () => ({ data: updatedRecord, error: null }),
            then: (resolve) => resolve({ data: updatedRecord ? [updatedRecord] : [], error: null }),
          }),
          then: (resolve) => resolve({ data: updatedRecord, error: null }),
        };
      },
    };
  }

  delete() {
    return {
      eq: (field, value) => {
        if (mockDb[this.table]) {
          mockDb[this.table] = mockDb[this.table].filter((item) => String(item[field]) !== String(value));
        }
        return {
          then: (resolve) => resolve({ data: true, error: null }),
        };
      },
    };
  }
}

// Khởi tạo Mock Supabase Client
export function createMockSupabaseClient() {
  return {
    from(tableName) {
      return new MockQueryBuilder(tableName);
    },
    async rpc(funcName, params = {}) {
      if (funcName === 'create_room_with_snapshot') {
        const roomId = crypto.randomUUID();
        let questions = (mockDb.questions || []).filter((q) => q.quiz_id === params.p_quiz_id);
        if (questions.length === 0) {
          questions = (mockDb.questions || []).slice(0, 4);
        }

        mockDb.rooms.push({
          id: roomId,
          code: params.p_code,
          host_guest_id: params.p_host_guest_id,
          quiz_id: params.p_quiz_id,
          status: 'waiting',
          max_players: params.p_max_players || 20,
          time_per_question: params.p_time_per_question || 20,
          current_question_index: -1,
          total_questions: questions.length,
          created_at: new Date().toISOString(),
        });

        // Snapshot câu hỏi và đáp án cho phòng
        questions.forEach((q, qIdx) => {
          const rqId = crypto.randomUUID();
          mockDb.room_questions.push({
            id: rqId,
            room_id: roomId,
            order_index: qIdx,
            content: q.content,
            question_type: q.question_type || 'multiple_choice',
            points: q.points || 100,
            time_limit_seconds: params.p_time_per_question || 20,
            explanation: q.explanation || '',
          });

          const opts = (mockDb.question_options || []).filter((o) => o.question_id === q.id);
          opts.forEach((opt, oIdx) => {
            mockDb.room_question_options.push({
              id: crypto.randomUUID(),
              room_question_id: rqId,
              content: opt.content,
              order_index: oIdx,
              is_correct: opt.is_correct,
            });
          });
        });

        return { data: roomId, error: null };
      }

      if (funcName === 'join_room_atomic') {
        const room = (mockDb.rooms || []).find((r) => r.code === params.p_room_code);
        if (!room) return { data: { success: false, error: 'ROOM_NOT_FOUND' }, error: null };

        const existing = (mockDb.room_players || []).find(
          (p) => p.room_id === room.id && p.guest_id === params.p_guest_id
        );
        if (existing) {
          return { data: { success: true, room_id: room.id, player_id: existing.id }, error: null };
        }

        const playerId = crypto.randomUUID();
        mockDb.room_players.push({
          id: playerId,
          room_id: room.id,
          guest_id: params.p_guest_id,
          nickname: params.p_nickname,
          status: 'joined',
          score: 0,
          streak: 0,
          correct_answers_count: 0,
          joined_at: new Date().toISOString(),
        });
        return { data: { success: true, room_id: room.id, player_id: playerId }, error: null };
      }

      if (funcName === 'submit_answer_atomic') {
        const option = (mockDb.room_question_options || []).find((o) => o.id === params.p_selected_option_id)
          || (mockDb.question_options || []).find((o) => o.id === params.p_selected_option_id);
        const isCorrect = option ? Boolean(option.is_correct) : false;

        const player = (mockDb.room_players || []).find(
          (p) => p.room_id === params.p_room_id && p.guest_id === params.p_guest_id
        );
        let speedBonus = 0;
        let pointsAwarded = 0;
        if (isCorrect) {
          speedBonus = Math.max(0, Math.floor((1 - (params.p_client_time_taken_ms || 3000) / 20000) * 50));
          pointsAwarded = 100 + speedBonus;
          if (player) {
            player.streak = (player.streak || 0) + 1;
            if (player.streak >= 3) pointsAwarded += 10;
            player.score = (player.score || 0) + pointsAwarded;
            player.correct_answers_count = (player.correct_answers_count || 0) + 1;
          }
        } else if (player) {
          player.streak = 0;
        }

        return {
          data: {
            success: true,
            is_correct: isCorrect,
            points_awarded: pointsAwarded,
            speed_bonus: speedBonus,
            current_streak: player ? player.streak : 0,
            total_score: player ? player.score : 0,
          },
          error: null,
        };
      }

      if (funcName === 'advance_room_question_atomic') {
        const room = (mockDb.rooms || []).find((r) => r.id === params.p_room_id);
        if (room) {
          room.status = 'in_progress';
          room.current_question_index = (room.current_question_index || -1) + 1;
          room.question_started_at = new Date().toISOString();
          room.question_deadline_at = new Date(Date.now() + (room.time_per_question || 20) * 1000).toISOString();
        }
        return {
          data: {
            success: true,
            status: 'in_progress',
            current_question_index: room ? room.current_question_index : 0,
            time_limit_seconds: room ? room.time_per_question : 20,
          },
          error: null,
        };
      }

      return { data: { success: true }, error: null };
    },
  };
}
