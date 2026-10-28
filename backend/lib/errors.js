// backend/lib/errors.js

export class AppError extends Error {
  constructor(message, code, statusCode = 400, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message || 'Dữ liệu yêu cầu không hợp lệ', 'VALIDATION_ERROR', 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Yêu cầu xác thực hợp lệ') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy tài nguyên yêu cầu') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Xảy ra xung đột dữ liệu', code = 'CONFLICT') {
    super(message, code, 409);
  }
}

export class DeadlineExceededError extends AppError {
  constructor(message = 'Đã hết thời gian nộp câu trả lời') {
    super(message, 'DEADLINE_EXCEEDED', 410);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Vượt quá giới hạn request, vui lòng thử lại sau') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}
