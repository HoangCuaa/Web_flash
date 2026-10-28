// backend/api/v1/admin/quizzes.js
import { handleCors, sendSuccess, sendError } from '../../../lib/http.js';
import { verifyAdmin } from '../../../lib/auth.js';
import {
  adminCreateQuiz,
  adminListQuizzes,
  adminGetQuizDetail,
  adminDeleteQuiz,
} from '../../../services/quiz-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  try {
    verifyAdmin(req);

    if (req.method === 'GET') {
      const { id } = req.query || {};
      if (id) {
        const quiz = await adminGetQuizDetail(id);
        return sendSuccess(res, quiz);
      }
      const list = await adminListQuizzes();
      return sendSuccess(res, list);
    }

    if (req.method === 'POST') {
      const { title, description, category, timePerQuestion, questions } = req.body || {};
      if (!title || !Array.isArray(questions)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'title và mảng questions là bắt buộc' },
        });
      }

      const created = await adminCreateQuiz({
        title,
        description,
        category,
        timePerQuestion,
        questions,
      });

      return sendSuccess(res, created, { message: 'Tạo quiz thành công' }, 201);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query || req.body || {};
      if (!id) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Thiếu id bộ câu hỏi cần xóa' },
        });
      }

      const result = await adminDeleteQuiz(id);
      return sendSuccess(res, result, { message: 'Đã xóa quiz thành công' });
    }

    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' },
    });
  } catch (error) {
    return sendError(res, error, req);
  }
}
