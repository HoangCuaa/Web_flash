// backend/lib/logger.js

const SENSITIVE_KEYS = new Set([
  'token',
  'token_hash',
  'guest_token',
  'recovery_code',
  'recovery_code_hash',
  'admin_secret',
  'x-admin-key',
  'authorization',
  'is_correct',
  'correct_option_ids',
]);

function maskSensitiveData(obj, depth = 0) {
  if (depth > 4 || obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item, depth + 1));
  }

  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value, depth + 1);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export const logger = {
  info(message, context = {}) {
    console.log(
      JSON.stringify({
        level: 'INFO',
        timestamp: new Date().toISOString(),
        message,
        context: maskSensitiveData(context),
      })
    );
  },

  warn(message, context = {}) {
    console.warn(
      JSON.stringify({
        level: 'WARN',
        timestamp: new Date().toISOString(),
        message,
        context: maskSensitiveData(context),
      })
    );
  },

  error(message, error = null, context = {}) {
    console.error(
      JSON.stringify({
        level: 'ERROR',
        timestamp: new Date().toISOString(),
        message,
        error: error
          ? {
              name: error.name,
              message: error.message,
              code: error.code,
            }
          : null,
        context: maskSensitiveData(context),
      })
    );
  },
};
