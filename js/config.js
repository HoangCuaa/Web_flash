// js/config.js — Cấu hình và dữ liệu dự phòng mặc định

export const API_BASE = '/api/v1';

export const FALLBACK_QUIZ = {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Kiến Thức Web & JavaScript Nền Tảng',
    questions: [
        {
            id: 'q1',
            question: 'Trong JavaScript, kiểu dữ liệu nào sau đây là kiểu nguyên thủy (primitive)?',
            options: ['Object', 'Array', 'String', 'Function'],
            correct: 2,
        },
        {
            id: 'q2',
            question: 'Mã trạng thái HTTP 404 biểu thị điều gì?',
            options: ['Unauthorized', 'Not Found', 'Internal Server Error', 'Forbidden'],
            correct: 1,
        },
        {
            id: 'q3',
            question: 'Giao thức HTTPS mặc định sử dụng cổng (port) nào?',
            options: ['80', '443', '8080', '22'],
            correct: 1,
        },
        {
            id: 'q4',
            question: 'Toán tử "===" trong JavaScript so sánh cả giá trị và kiểu dữ liệu (Strict equality).',
            options: ['Đúng', 'Sai'],
            correct: 0,
        },
    ],
};
