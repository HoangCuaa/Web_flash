// backend/server/router.js
// Bộ định tuyến phân phối request API tới đúng serverless handler

export async function routeApi(req, res, pathname) {
  try {
    // 1. Guests
    if (pathname === '/api/v1/guests' || pathname === '/api/v1/guests/') {
      const { default: handler } = await import('../api/v1/guests/index.js');
      return await handler(req, res);
    }
    if (pathname === '/api/v1/guests/recover') {
      const { default: handler } = await import('../api/v1/guests/recover.js');
      return await handler(req, res);
    }

    // 2. Players
    if (pathname === '/api/v1/players/me') {
      const { default: handler } = await import('../api/v1/players/me.js');
      return await handler(req, res);
    }
    if (pathname === '/api/v1/players/me/history' || pathname === '/api/v1/players/me/history/') {
      const { default: handler } = await import('../api/v1/players/me/history.js');
      return await handler(req, res);
    }
    const attemptHistoryMatch = pathname.match(/^\/api\/v1\/players\/me\/history\/([^/]+)$/);
    if (attemptHistoryMatch) {
      req.query = req.query || {};
      req.query.attemptId = attemptHistoryMatch[1];
      const { default: handler } = await import('../api/v1/players/me/history/[attemptId].js');
      return await handler(req, res);
    }

    // 3. Quizzes
    if (pathname === '/api/v1/quizzes' || pathname === '/api/v1/quizzes/') {
      const { default: handler } = await import('../api/v1/quizzes/index.js');
      return await handler(req, res);
    }
    const quizLeaderboardMatch = pathname.match(/^\/api\/v1\/quizzes\/([^/]+)\/leaderboard$/);
    if (quizLeaderboardMatch) {
      req.query = req.query || {};
      req.query.quizId = quizLeaderboardMatch[1];
      const { default: handler } = await import('../api/v1/quizzes/[quizId]/leaderboard.js');
      return await handler(req, res);
    }
    const quizDetailMatch = pathname.match(/^\/api\/v1\/quizzes\/([^/]+)$/);
    if (quizDetailMatch) {
      req.query = req.query || {};
      req.query.quizId = quizDetailMatch[1];
      const { default: handler } = await import('../api/v1/quizzes/[quizId]/index.js');
      return await handler(req, res);
    }

    // 4. Admin
    if (pathname === '/api/v1/admin/quizzes' || pathname === '/api/v1/admin/quizzes/') {
      const { default: handler } = await import('../api/v1/admin/quizzes.js');
      return await handler(req, res);
    }
    if (pathname === '/api/v1/admin/stats' || pathname === '/api/v1/admin/stats/') {
      const { default: handler } = await import('../api/v1/admin/stats.js');
      return await handler(req, res);
    }
    if (pathname === '/api/v1/admin/questions/import' || pathname === '/api/v1/admin/questions/import/') {
      const { default: handler } = await import('../api/v1/admin/questions/import.js');
      return await handler(req, res);
    }

    // 5. Rooms (Root)
    if (pathname === '/api/v1/rooms' || pathname === '/api/v1/rooms/') {
      const { default: handler } = await import('../api/v1/rooms/index.js');
      return await handler(req, res);
    }

    // 6. Dynamic Rooms: /api/v1/rooms/:roomCode/...
    const roomMatch = pathname.match(/^\/api\/v1\/rooms\/([^/]+)(\/(.*))?$/);
    if (roomMatch) {
      const roomCode = roomMatch[1];
      const subPath = roomMatch[3] || 'index';
      req.query = req.query || {};
      req.query.roomCode = roomCode;

      const roomRouteHandlers = {
        'index': '../api/v1/rooms/[roomCode]/index.js',
        'join': '../api/v1/rooms/[roomCode]/join.js',
        'ready': '../api/v1/rooms/[roomCode]/ready.js',
        'leave': '../api/v1/rooms/[roomCode]/leave.js',
        'start': '../api/v1/rooms/[roomCode]/start.js',
        'cancel': '../api/v1/rooms/[roomCode]/cancel.js',
        'next-question': '../api/v1/rooms/[roomCode]/next-question.js',
        'players': '../api/v1/rooms/[roomCode]/players.js',
        'state': '../api/v1/rooms/[roomCode]/state.js',
        'current-question': '../api/v1/rooms/[roomCode]/current-question.js',
        'answers': '../api/v1/rooms/[roomCode]/answers.js',
        'skip': '../api/v1/rooms/[roomCode]/skip.js',
        'results': '../api/v1/rooms/[roomCode]/results.js',
        'leaderboard': '../api/v1/rooms/[roomCode]/leaderboard.js',
      };

      if (roomRouteHandlers[subPath]) {
        const { default: handler } = await import(roomRouteHandlers[subPath]);
        return await handler(req, res);
      }
    }

    // 7. Leaderboards
    if (pathname === '/api/v1/leaderboard/global' || pathname === '/api/v1/leaderboard/global/') {
      const { default: handler } = await import('../api/v1/leaderboard/global.js');
      return await handler(req, res);
    }
    if (pathname === '/api/v1/leaderboard/daily' || pathname === '/api/v1/leaderboard/daily/') {
      const { default: handler } = await import('../api/v1/leaderboard/daily.js');
      return await handler(req, res);
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
