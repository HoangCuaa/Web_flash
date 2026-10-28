// backend/api/v1/quizzes/index.js
import { handleCors, sendSuccess, sendError } from '../../../lib/http.js';
import { listPublicQuizzes } from '../../../services/quiz-service.js';

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  try {
    const quizzes = await listPublicQuizzes();
    return sendSuccess(res, quizzes);
  } catch (error) {
    return sendError(res, error, req);
  }
}
