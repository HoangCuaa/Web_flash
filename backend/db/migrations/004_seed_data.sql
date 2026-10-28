-- 004_seed_data.sql
-- Dữ liệu mẫu ban đầu để kiểm thử hệ thống

DO $$
DECLARE
    v_quiz_id UUID;
    v_q1 UUID;
    v_q2 UUID;
    v_q3 UUID;
    v_q4 UUID;
BEGIN
    -- 1. Tạo Quiz mẫu: "Kiến thức Web & JavaScript cơ bản"
    INSERT INTO quizzes (id, title, description, category, is_public, time_per_question)
    VALUES (
        '11111111-1111-1111-1111-111111111111',
        'Kiến thức Web & JavaScript Nền Tảng',
        'Bộ câu hỏi trắc nghiệm ôn tập kiến thức HTML, CSS, JavaScript và HTTP cơ bản.',
        'Lập trình Web',
        true,
        20
    ) ON CONFLICT (id) DO NOTHING;

    v_quiz_id := '11111111-1111-1111-1111-111111111111';

    -- Câu hỏi 1
    INSERT INTO questions (id, quiz_id, content, question_type, points, explanation)
    VALUES (
        '22222222-2222-2222-2222-222222222201',
        v_quiz_id,
        'Trong JavaScript, kiểu dữ liệu nào sau đây là kiểu dữ liệu nguyên thủy (primitive)?',
        'multiple_choice',
        100,
        'String, Number, BigInt, Boolean, Symbol, Undefined, Null là các kiểu primitive trong JS.'
    ) ON CONFLICT (id) DO NOTHING;
    v_q1 := '22222222-2222-2222-2222-222222222201';

    INSERT INTO question_options (question_id, content, is_correct, order_index) VALUES
    (v_q1, 'Object', false, 0),
    (v_q1, 'Array', false, 1),
    (v_q1, 'String', true, 2),
    (v_q1, 'Function', false, 3)
    ON CONFLICT DO NOTHING;

    -- Câu hỏi 2
    INSERT INTO questions (id, quiz_id, content, question_type, points, explanation)
    VALUES (
        '22222222-2222-2222-2222-222222222202',
        v_quiz_id,
        'Mã trạng thái HTTP 404 có ý nghĩa là gì?',
        'multiple_choice',
        100,
        '404 Not Found biểu thị tài nguyên yêu cầu không được tìm thấy trên máy chủ.'
    ) ON CONFLICT (id) DO NOTHING;
    v_q2 := '22222222-2222-2222-2222-222222222202';

    INSERT INTO question_options (question_id, content, is_correct, order_index) VALUES
    (v_q2, 'Unauthorized', false, 0),
    (v_q2, 'Not Found', true, 1),
    (v_q2, 'Internal Server Error', false, 2),
    (v_q2, 'Forbidden', false, 3)
    ON CONFLICT DO NOTHING;

    -- Câu hỏi 3
    INSERT INTO questions (id, quiz_id, content, question_type, points, explanation)
    VALUES (
        '22222222-2222-2222-2222-222222222203',
        v_quiz_id,
        'Giao thức HTTPS mặc định sử dụng cổng (port) nào?',
        'multiple_choice',
        100,
        'HTTP dùng cổng 80, còn HTTPS sử dụng cổng bảo mật 443.'
    ) ON CONFLICT (id) DO NOTHING;
    v_q3 := '22222222-2222-2222-2222-222222222203';

    INSERT INTO question_options (question_id, content, is_correct, order_index) VALUES
    (v_q3, '80', false, 0),
    (v_q3, '443', true, 1),
    (v_q3, '8080', false, 2),
    (v_q3, '22', false, 3)
    ON CONFLICT DO NOTHING;

    -- Câu hỏi 4 (Đúng/Sai)
    INSERT INTO questions (id, quiz_id, content, question_type, points, explanation)
    VALUES (
        '22222222-2222-2222-2222-222222222204',
        v_quiz_id,
        'Toán tử "===" trong JavaScript so sánh cả giá trị và kiểu dữ liệu (Strict equality).',
        'true_false',
        100,
        'Đúng, "===" kiểm tra chặt chẽ giá trị và kiểu mà không thực hiện ép kiểu tự động.'
    ) ON CONFLICT (id) DO NOTHING;
    v_q4 := '22222222-2222-2222-2222-222222222204';

    INSERT INTO question_options (question_id, content, is_correct, order_index) VALUES
    (v_q4, 'Đúng', true, 0),
    (v_q4, 'Sai', false, 1)
    ON CONFLICT DO NOTHING;

END $$;
