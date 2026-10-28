// backend/services/quiz-service.js
import { getSupabase } from '../lib/supabase.js';
import { NotFoundError } from '../lib/errors.js';

export async function listPublicQuizzes() {
  const supabase = getSupabase();

  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select(`
      id,
      title,
      description,
      category,
      time_per_question,
      created_at,
      questions (
        id
      )
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Lỗi lấy danh sách bộ câu hỏi');
  }

  return (quizzes || []).map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    category: q.category,
    timePerQuestion: q.time_per_question,
    questionCount: q.questions ? q.questions.length : 0,
    createdAt: q.created_at,
  }));
}

export async function getQuizById(quizId) {
  const supabase = getSupabase();

  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select(`
      id,
      title,
      description,
      category,
      time_per_question,
      created_at,
      questions (
        id,
        content,
        question_type,
        points,
        question_options (
          id,
          content,
          order_index
        )
      )
    `)
    .eq('id', quizId)
    .eq('is_public', true)
    .single();

  if (error || !quiz) {
    throw new NotFoundError('Không tìm thấy bộ câu hỏi hoặc bộ câu hỏi không công khai');
  }

  // Chú ý: TUYỆT ĐỐI KHÔNG trả về trường is_correct trong danh sách options cho người chơi
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    category: quiz.category,
    timePerQuestion: quiz.time_per_question,
    totalQuestions: quiz.questions ? quiz.questions.length : 0,
    questions: (quiz.questions || []).map((q) => {
      const correctIdx = (q.question_options || []).findIndex((o) => o.is_correct === true);
      return {
        id: q.id,
        content: q.content,
        type: q.question_type,
        points: q.points,
        correctIndex: correctIdx >= 0 ? correctIdx : 0,
        options: (q.question_options || []).map((opt) => ({
          id: opt.id,
          content: opt.content,
          order_index: opt.order_index,
        })),
      };
    }),
  };
}

export async function adminCreateQuiz({ title, description, category, timePerQuestion = 20, questions = [] }) {
  const supabase = getSupabase();

  // 1. Tạo quiz
  const { data: quiz, error: qError } = await supabase
    .from('quizzes')
    .insert({
      title,
      description,
      category: category || 'Chung',
      time_per_question: timePerQuestion,
      is_public: true,
    })
    .select('id, title, created_at')
    .single();

  if (qError) {
    throw new Error(`Không thể tạo quiz: ${qError.message}`);
  }

  // 2. Chèn câu hỏi và đáp án
  for (const q of questions) {
    const { data: insertedQ, error: insQError } = await supabase
      .from('questions')
      .insert({
        quiz_id: quiz.id,
        content: q.content,
        question_type: q.questionType || 'multiple_choice',
        points: q.points || 100,
        explanation: q.explanation || null,
      })
      .select('id')
      .single();

    if (insQError) continue;

    if (Array.isArray(q.options) && q.options.length > 0) {
      const optionsToInsert = q.options.map((opt, idx) => ({
        question_id: insertedQ.id,
        content: typeof opt === 'string' ? opt : opt.content,
        is_correct: typeof opt === 'string' ? idx === q.correct : !!opt.isCorrect,
        order_index: idx,
      }));

      await supabase.from('question_options').insert(optionsToInsert);
    }
  }

  return {
    quizId: quiz.id,
    title: quiz.title,
    totalQuestions: questions.length,
  };
}

export async function adminListQuizzes() {
  const supabase = getSupabase();
  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select(`
      id,
      title,
      description,
      category,
      time_per_question,
      is_public,
      created_at,
      questions (
        id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Lỗi lấy danh sách quiz quản trị: ' + error.message);
  }

  return (quizzes || []).map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    category: q.category,
    timePerQuestion: q.time_per_question,
    isPublic: q.is_public,
    questionCount: q.questions ? q.questions.length : 0,
    createdAt: q.created_at,
  }));
}

export async function adminGetQuizDetail(quizId) {
  const supabase = getSupabase();
  const { data: quiz, error } = await supabase
    .from('quizzes')
    .select(`
      id,
      title,
      description,
      category,
      time_per_question,
      is_public,
      created_at,
      questions (
        id,
        content,
        question_type,
        points,
        explanation,
        question_options (
          id,
          content,
          is_correct,
          order_index
        )
      )
    `)
    .eq('id', quizId)
    .single();

  if (error || !quiz) {
    throw new NotFoundError('Không tìm thấy bộ câu hỏi');
  }

  return quiz;
}

export async function adminDeleteQuiz(quizId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', quizId);

  if (error) {
    throw new Error('Lỗi xóa quiz: ' + error.message);
  }

  return { success: true };
}

export async function adminGetStats() {
  const supabase = getSupabase();

  const [
    { count: quizCount },
    { count: questionCount },
    { count: roomCount },
    { count: attemptCount },
  ] = await Promise.all([
    supabase.from('quizzes').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('rooms').select('*', { count: 'exact', head: true }),
    supabase.from('attempts').select('*', { count: 'exact', head: true }),
  ]);

  return {
    totalQuizzes: quizCount || 0,
    totalQuestions: questionCount || 0,
    totalRooms: roomCount || 0,
    totalAttempts: attemptCount || 0,
  };
}
