// backend/tests/integration/api-mock.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import guestsHandler from '../../api/v1/guests/index.js';

// Mock helper tạo req và res giả lập như Vercel Serverless Function
function createMockReqRes({ method = 'GET', body = {}, query = {}, headers = {} }) {
  const req = {
    method,
    body,
    query,
    headers: {
      'x-forwarded-for': '127.0.0.1',
      ...headers,
    },
  };

  const res = {
    statusCode: 200,
    headers: {},
    ended: false,
    body: null,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    },
  };

  return { req, res };
}

describe('API Integration Mock Tests', () => {
  it('xử lý CORS preflight OPTIONS request chính xác', async () => {
    const { req, res } = createMockReqRes({ method: 'OPTIONS' });
    await guestsHandler(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.ended, true);
    assert.equal(res.headers['access-control-allow-methods'], 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  });

  it('từ chối HTTP method không được hỗ trợ với status 405', async () => {
    const { req, res } = createMockReqRes({ method: 'DELETE' });
    await guestsHandler(req, res);

    assert.equal(res.statusCode, 405);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'METHOD_NOT_ALLOWED');
  });

  it('trả về lỗi VALIDATION_ERROR (status 400) khi nickname không hợp lệ', async () => {
    const { req, res } = createMockReqRes({
      method: 'POST',
      body: { nickname: 'X' }, // quá ngắn (< 2 ký tự)
    });
    await guestsHandler(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.message.includes('2 ký tự'));
  });
});
