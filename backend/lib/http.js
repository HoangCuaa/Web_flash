// backend/lib/http.js
import crypto from 'node:crypto';
import { AppError } from './errors.js';

export function handleCors(req, res) {
  const origin = process.env.APP_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-guest-token, x-admin-key, Idempotency-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
}

export function sendSuccess(res, data = {}, meta = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

export function sendError(res, error, req = null) {
  const requestId = req?.headers['x-request-id'] || crypto.randomUUID();

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details || {},
      },
      requestId,
    });
  }

  // Lỗi không lường trước (Internal Server Error)
  console.error(`[CRITICAL] RequestId: ${requestId}`, error);

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
    },
    requestId,
  });
}
