// backend/server/middleware.js
// Các middleware hỗ trợ request parsing, response helpers và CORS

export function setupResponseHelpers(res) {
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };
  res.json = function (data) {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.end(JSON.stringify(data));
    return this;
  };
}

export async function parseRequestBody(req) {
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.body = {};
    return;
  }

  let bodyData = '';
  req.on('data', (chunk) => {
    bodyData += chunk;
    // Giới hạn payload size 1MB chống tràn bộ nhớ
    if (bodyData.length > 1048576) {
      req.destroy();
    }
  });

  await new Promise((resolve) => req.on('end', resolve));

  if (bodyData) {
    try {
      req.body = JSON.parse(bodyData);
    } catch {
      req.body = {};
    }
  } else {
    req.body = {};
  }
}

export function handleOptionsCors(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-token, x-guest-id, x-admin-key, idempotency-key',
      'Access-Control-Max-Age': '86400',
    });
    res.end();
    return true;
  }
  return false;
}
