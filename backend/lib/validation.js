// backend/lib/validation.js
import { z } from 'zod';
import { ValidationError } from './errors.js';

// Tiện ích làm sạch nickname: loại bỏ ký tự điều khiển, chuẩn hóa Unicode
export function sanitizeNickname(name) {
  if (typeof name !== 'string') return '';
  return name
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim();
}

export const createGuestSchema = z.object({
  nickname: z
    .string({ required_error: 'Biệt danh (nickname) là bắt buộc' })
    .min(2, 'Nickname phải có ít nhất 2 ký tự')
    .max(50, 'Nickname không được vượt quá 50 ký tự')
    .transform(sanitizeNickname)
    .refine((val) => val.length >= 2, {
      message: 'Nickname chứa các ký tự không hợp lệ',
    }),
});

export const recoverGuestSchema = z.object({
  recoveryCode: z
    .string({ required_error: 'Mã khôi phục là bắt buộc' })
    .min(6, 'Mã khôi phục không hợp lệ')
    .max(64, 'Mã khôi phục không hợp lệ')
    .trim(),
});

export const createRoomSchema = z.object({
  quizId: z.string().uuid('ID bộ câu hỏi (quizId) không hợp lệ'),
  maxPlayers: z.number().int().min(2, 'Tối thiểu 2 người chơi').max(100, 'Tối đa 100 người chơi').default(20),
  timePerQuestion: z.number().int().min(5, 'Thời gian tối thiểu mỗi câu là 5 giây').max(120, 'Thời gian tối đa mỗi câu là 120 giây').default(20),
});

export const joinRoomSchema = z.object({
  nickname: z
    .string({ required_error: 'Biệt danh là bắt buộc' })
    .min(2, 'Nickname phải từ 2 ký tự trở lên')
    .max(50, 'Nickname tối đa 50 ký tự')
    .transform(sanitizeNickname)
    .refine((val) => val.length >= 2, {
      message: 'Nickname không hợp lệ',
    }),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid('ID câu hỏi không hợp lệ'),
  selectedOptionId: z.string().uuid('ID đáp án lựa chọn không hợp lệ').nullable().optional(),
  clientTimeTakenMs: z.number().int().min(0).max(300000).default(0),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Hàm trợ giúp validate và ném lỗi ValidationError nếu không hợp lệ
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const formatted = result.error.format();
    const firstErrorMessage = result.error.errors[0]?.message || 'Dữ liệu không hợp lệ';
    throw new ValidationError(firstErrorMessage, formatted);
  }
  return result.data;
}
