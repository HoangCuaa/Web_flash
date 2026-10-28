// backend/api/v1/quizzes/[quizId]/index.js
import { handleCors, sendSuccess, sendError } from '../../../../lib/http.js';
import { getQuizById } from '../../../../services/quiz-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const { quizId } = req.query;
    const quiz = await getQuizById(quizId);

    return sendSuccess(res, quiz);
  } catch (error) {
    return sendError(res, error, req);
  }
}
