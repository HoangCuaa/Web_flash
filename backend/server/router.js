// backend/server/router.js
// Bộ định tuyến phân phối request API tới đúng serverless handler (Static imports để Vercel/NFT bundle 100%)

import guestsIndexHandler from '../api/v1/guests/index.js';
import guestsRecoverHandler from '../api/v1/guests/recover.js';

import playersMeHandler from '../api/v1/players/me.js';
import playersMeHistoryHandler from '../api/v1/players/me/history.js';
import playersMeHistoryAttemptHandler from '../api/v1/players/me/history/[attemptId].js';

import quizzesIndexHandler from '../api/v1/quizzes/index.js';
import quizDetailHandler from '../api/v1/quizzes/[quizId]/index.js';
import quizLeaderboardHandler from '../api/v1/quizzes/[quizId]/leaderboard.js';

import adminQuizzesHandler from '../api/v1/admin/quizzes.js';
import adminStatsHandler from '../api/v1/admin/stats.js';
import adminQuestionsImportHandler from '../api/v1/admin/questions/import.js';

import roomsIndexHandler from '../api/v1/rooms/index.js';
import roomDetailHandler from '../api/v1/rooms/[roomCode]/index.js';
import roomJoinHandler from '../api/v1/rooms/[roomCode]/join.js';
import roomReadyHandler from '../api/v1/rooms/[roomCode]/ready.js';
import roomLeaveHandler from '../api/v1/rooms/[roomCode]/leave.js';
import roomStartHandler from '../api/v1/rooms/[roomCode]/start.js';
import roomCancelHandler from '../api/v1/rooms/[roomCode]/cancel.js';
import roomNextQuestionHandler from '../api/v1/rooms/[roomCode]/next-question.js';
import roomPlayersHandler from '../api/v1/rooms/[roomCode]/players.js';
import roomStateHandler from '../api/v1/rooms/[roomCode]/state.js';
import roomCurrentQuestionHandler from '../api/v1/rooms/[roomCode]/current-question.js';
import roomAnswersHandler from '../api/v1/rooms/[roomCode]/answers.js';
import roomSkipHandler from '../api/v1/rooms/[roomCode]/skip.js';
import roomResultsHandler from '../api/v1/rooms/[roomCode]/results.js';
import roomLeaderboardHandler from '../api/v1/rooms/[roomCode]/leaderboard.js';

import leaderboardGlobalHandler from '../api/v1/leaderboard/global.js';
import leaderboardDailyHandler from '../api/v1/leaderboard/daily.js';

const roomHandlersMap = {
  'index': roomDetailHandler,
  'join': roomJoinHandler,
  'ready': roomReadyHandler,
  'leave': roomLeaveHandler,
  'start': roomStartHandler,
  'cancel': roomCancelHandler,
  'next-question': roomNextQuestionHandler,
  'players': roomPlayersHandler,
  'state': roomStateHandler,
  'current-question': roomCurrentQuestionHandler,
  'answers': roomAnswersHandler,
  'skip': roomSkipHandler,
  'results': roomResultsHandler,
  'leaderboard': roomLeaderboardHandler,
};

export async function routeApi(req, res, pathname) {
  try {
    // Chuẩn hoá pathname (bỏ trailing slash nếu không phải root)
    const normalized = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

    // 1. Guests
    if (normalized === '/api/v1/guests') {
      return await guestsIndexHandler(req, res);
    }
    if (normalized === '/api/v1/guests/recover') {
      return await guestsRecoverHandler(req, res);
    }

    // 2. Players
    if (normalized === '/api/v1/players/me') {
      return await playersMeHandler(req, res);
    }
    if (normalized === '/api/v1/players/me/history') {
      return await playersMeHistoryHandler(req, res);
    }
    const attemptHistoryMatch = normalized.match(/^\/api\/v1\/players\/me\/history\/([^/]+)$/);
    if (attemptHistoryMatch) {
      req.query = req.query || {};
      req.query.attemptId = attemptHistoryMatch[1];
      return await playersMeHistoryAttemptHandler(req, res);
    }

    // 3. Quizzes
    if (normalized === '/api/v1/quizzes') {
      return await quizzesIndexHandler(req, res);
    }
    const quizLeaderboardMatch = normalized.match(/^\/api\/v1\/quizzes\/([^/]+)\/leaderboard$/);
    if (quizLeaderboardMatch) {
      req.query = req.query || {};
      req.query.quizId = quizLeaderboardMatch[1];
      return await quizLeaderboardHandler(req, res);
    }
    const quizDetailMatch = normalized.match(/^\/api\/v1\/quizzes\/([^/]+)$/);
    if (quizDetailMatch) {
      req.query = req.query || {};
      req.query.quizId = quizDetailMatch[1];
      return await quizDetailHandler(req, res);
    }

    // 4. Admin
    if (normalized === '/api/v1/admin/quizzes') {
      return await adminQuizzesHandler(req, res);
    }
    if (normalized === '/api/v1/admin/stats') {
      return await adminStatsHandler(req, res);
    }
    if (normalized === '/api/v1/admin/questions/import') {
      return await adminQuestionsImportHandler(req, res);
    }

    // 5. Rooms (Root)
    if (normalized === '/api/v1/rooms') {
      return await roomsIndexHandler(req, res);
    }

    // 6. Dynamic Rooms: /api/v1/rooms/:roomCode/...
    const roomMatch = normalized.match(/^\/api\/v1\/rooms\/([^/]+)(\/(.*))?$/);
    if (roomMatch) {
      const roomCode = roomMatch[1];
      const subPath = roomMatch[3] || 'index';
      req.query = req.query || {};
      req.query.roomCode = roomCode;

      const handler = roomHandlersMap[subPath];
      if (handler) {
        return await handler(req, res);
      }
    }

    // 7. Leaderboards
    if (normalized === '/api/v1/leaderboard/global') {
      return await leaderboardGlobalHandler(req, res);
    }
    if (normalized === '/api/v1/leaderboard/daily') {
      return await leaderboardDailyHandler(req, res);
    }

    // 404 nếu không khớp endpoint
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: false,
      error: { code: 'ENDPOINT_NOT_FOUND', message: `Endpoint ${pathname} không tồn tại` },
    }));
  } catch (err) {
    console.error(`[API ERROR] ${pathname}:`, err);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: err.message },
    }));
  }
}
