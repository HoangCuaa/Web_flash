// backend/api/v1/admin/questions/import.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { verifyAdmin } from '../../../../lib/auth.js';
import { getSupabase } from '../../../../lib/supabase.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    verifyAdmin(req);

    const { quizId, questions } = req.body || {};
    if (!quizId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'quizId và danh sách câu hỏi questions không được để trống' } });
    }

    const supabase = getSupabase();
    let importedCount = 0;

    for (const q of questions) {
      const { data: insertedQ, error: qErr } = await supabase
        .from('questions')
        .insert({
          quiz_id: quizId,
          content: q.content,
          question_type: q.questionType || 'multiple_choice',
          points: q.points || 100,
          explanation: q.explanation || null,
        })
        .select('id')
        .single();

      if (qErr) continue;

      if (Array.isArray(q.options) && q.options.length > 0) {
        const opts = q.options.map((opt, i) => ({
          question_id: insertedQ.id,
          content: opt.content,
          is_correct: !!opt.isCorrect,
          order_index: i,
        }));
        await supabase.from('question_options').insert(opts);
      }
      importedCount++;
    }

    return sendSuccess(res, { importedCount }, { message: `Đã nhập thành công ${importedCount} câu hỏi` });
  } catch (error) {
    return sendError(res, error, req);
  }
}
