-- 002_functions_and_rpcs.sql
-- Các PostgreSQL Stored Procedures và Atomic Functions cho Gameplay

-- 1. Hàm tạo phòng và snapshot câu hỏi nguyên tử
CREATE OR REPLACE FUNCTION create_room_with_snapshot(
    p_host_guest_id UUID,
    p_quiz_id UUID,
    p_code VARCHAR(8),
    p_max_players INT DEFAULT 20,
    p_time_per_question INT DEFAULT 20
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
    v_q_count INT := 0;
    q RECORD;
    v_rq_id UUID;
    opt RECORD;
BEGIN
    -- Kiểm tra quiz có tồn tại không
    IF NOT EXISTS (SELECT 1 FROM quizzes WHERE id = p_quiz_id) THEN
        RAISE EXCEPTION 'QUIZ_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;

    -- Tạo phòng mới
    INSERT INTO rooms (
        code,
        host_guest_id,
        quiz_id,
        status,
        max_players,
        time_per_question,
        current_question_index
    ) VALUES (
        p_code,
        p_host_guest_id,
        p_quiz_id,
        'waiting',
        p_max_players,
        p_time_per_question,
        -1
    ) RETURNING id INTO v_room_id;

    -- Snapshot câu hỏi và đáp án từ quiz gốc sang room_questions & room_question_options
    FOR q IN 
        SELECT id, content, question_type, points, COALESCE(explanation, '') as explanation 
        FROM questions 
        WHERE quiz_id = p_quiz_id 
        ORDER BY created_at ASC
    LOOP
        INSERT INTO room_questions (
            room_id,
            question_id,
            order_index,
            content,
            question_type,
            points,
            time_limit_seconds,
            explanation
        ) VALUES (
            v_room_id,
            q.id,
            v_q_count,
            q.content,
            q.question_type,
            q.points,
            p_time_per_question,
            q.explanation
        ) RETURNING id INTO v_rq_id;

        -- Sao chép các options
        FOR opt IN
            SELECT content, order_index, is_correct
            FROM question_options
            WHERE question_id = q.id
            ORDER BY order_index ASC
        LOOP
            INSERT INTO room_question_options (
                room_question_id,
                content,
                order_index,
                is_correct
            ) VALUES (
                v_rq_id,
                opt.content,
                opt.order_index,
                opt.is_correct
            );
        END LOOP;

        v_q_count := v_q_count + 1;
    END LOOP;

    -- Cập nhật tổng số câu hỏi trong phòng
    UPDATE rooms SET total_questions = v_q_count WHERE id = v_room_id;

    RETURN v_room_id;
END;
$$;

-- 2. Hàm tham gia phòng nguyên tử (Join room)
CREATE OR REPLACE FUNCTION join_room_atomic(
    p_room_code VARCHAR(8),
    p_guest_id UUID,
    p_nickname VARCHAR(50)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_player_count INT;
    v_existing_player RECORD;
    v_clean_nick VARCHAR(50);
BEGIN
    v_clean_nick := TRIM(p_nickname);

    SELECT * INTO v_room FROM rooms WHERE code = UPPER(p_room_code);
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ROOM_NOT_FOUND');
    END IF;

    IF v_room.status != 'waiting' THEN
        RETURN jsonb_build_object('success', false, 'error', 'ROOM_ALREADY_STARTED');
    END IF;

    -- Kiểm tra người chơi đã trong phòng chưa
    SELECT * INTO v_existing_player FROM room_players WHERE room_id = v_room.id AND guest_id = p_guest_id;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true, 
            'room_id', v_room.id, 
            'player_id', v_existing_player.id, 
            'reconnected', true
        );
    END IF;

    -- Kiểm tra số người chơi hiện tại
    SELECT COUNT(*) INTO v_player_count FROM room_players WHERE room_id = v_room.id;
    IF v_player_count >= v_room.max_players THEN
        RETURN jsonb_build_object('success', false, 'error', 'ROOM_FULL');
    END IF;

    -- Kiểm tra nickname trùng
    IF EXISTS (SELECT 1 FROM room_players WHERE room_id = v_room.id AND LOWER(nickname) = LOWER(v_clean_nick)) THEN
        RETURN jsonb_build_object('success', false, 'error', 'NICKNAME_TAKEN');
    END IF;

    -- Thêm người chơi mới
    INSERT INTO room_players (room_id, guest_id, nickname, status)
    VALUES (v_room.id, p_guest_id, v_clean_nick, 'joined');

    RETURN jsonb_build_object(
        'success', true, 
        'room_id', v_room.id, 
        'code', v_room.code,
        'reconnected', false
    );
END;
$$;

-- 3. Hàm nộp câu trả lời nguyên tử (Chống cheat điểm, chống nộp lặp, kiểm tra deadline)
CREATE OR REPLACE FUNCTION submit_answer_atomic(
    p_room_id UUID,
    p_guest_id UUID,
    p_room_question_id UUID,
    p_selected_option_id UUID,
    p_client_time_taken_ms INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_player RECORD;
    v_attempt_id UUID;
    v_question RECORD;
    v_option RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_is_correct BOOLEAN := false;
    v_points INT := 0;
    v_speed_bonus INT := 0;
    v_total_points INT := 0;
    v_time_remaining_ms NUMERIC;
    v_total_time_ms NUMERIC;
    v_new_streak INT := 0;
BEGIN
    -- 1. Kiểm tra phòng
    SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
    IF NOT FOUND OR v_room.status != 'in_progress' THEN
        RETURN jsonb_build_object('success', false, 'error', 'ROOM_NOT_PLAYING');
    END IF;

    -- 2. Kiểm tra câu hỏi hiện tại có khớp không
    SELECT * INTO v_question FROM room_questions 
    WHERE id = p_room_question_id AND room_id = p_room_id;
    
    IF NOT FOUND OR v_question.order_index != v_room.current_question_index THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_QUESTION');
    END IF;

    -- 3. Kiểm tra hạn nộp (Deadline + 1.5 giây network grace period)
    IF v_room.question_deadline_at IS NOT NULL AND v_now > (v_room.question_deadline_at + INTERVAL '1.5 second') THEN
        RETURN jsonb_build_object('success', false, 'error', 'DEADLINE_EXCEEDED');
    END IF;

    -- 4. Kiểm tra người chơi trong phòng
    SELECT * INTO v_player FROM room_players 
    WHERE room_id = p_room_id AND guest_id = p_guest_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'PLAYER_NOT_IN_ROOM');
    END IF;

    -- 5. Lấy hoặc tạo attempt
    SELECT id INTO v_attempt_id FROM attempts 
    WHERE room_id = p_room_id AND guest_id = p_guest_id;
    
    IF v_attempt_id IS NULL THEN
        INSERT INTO attempts (room_id, guest_id, quiz_id, total_questions)
        VALUES (p_room_id, p_guest_id, v_room.quiz_id, v_room.total_questions)
        RETURNING id INTO v_attempt_id;
    END IF;

    -- 6. Kiểm tra xem đã nộp câu này chưa (Chống nộp lặp)
    IF EXISTS (SELECT 1 FROM answers WHERE attempt_id = v_attempt_id AND room_question_id = p_room_question_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'DUPLICATE_SUBMISSION');
    END IF;

    -- 7. Chấm điểm phía Server
    IF p_selected_option_id IS NOT NULL THEN
        SELECT * INTO v_option FROM room_question_options 
        WHERE id = p_selected_option_id AND room_question_id = p_room_question_id;

        IF FOUND AND v_option.is_correct THEN
            v_is_correct := true;
            v_points := v_question.points;

            -- Tính điểm thưởng tốc độ (tối đa 50 điểm)
            IF v_room.question_deadline_at IS NOT NULL AND v_room.question_started_at IS NOT NULL THEN
                v_total_time_ms := EXTRACT(EPOCH FROM (v_room.question_deadline_at - v_room.question_started_at)) * 1000;
                v_time_remaining_ms := EXTRACT(EPOCH FROM (v_room.question_deadline_at - v_now)) * 1000;
                
                IF v_total_time_ms > 0 AND v_time_remaining_ms > 0 THEN
                    v_speed_bonus := LEAST(50, GREATEST(0, ROUND((v_time_remaining_ms / v_total_time_ms) * 50)));
                END IF;
            END IF;

            v_new_streak := v_player.streak + 1;
            -- Thêm streak bonus nếu chuỗi >= 3
            IF v_new_streak >= 3 THEN
                v_points := v_points + 10;
            END IF;

            v_total_points := v_points + v_speed_bonus;
        ELSE
            v_new_streak := 0;
            v_total_points := 0;
        END IF;
    ELSE
        -- Bỏ qua hoặc không chọn
        v_new_streak := 0;
        v_total_points := 0;
    END IF;

    -- 8. Ghi nhận câu trả lời vào bảng answers
    INSERT INTO answers (
        attempt_id,
        room_question_id,
        selected_option_id,
        is_correct,
        points_awarded,
        time_taken_ms,
        answered_at
    ) VALUES (
        v_attempt_id,
        p_room_question_id,
        p_selected_option_id,
        v_is_correct,
        v_total_points,
        p_client_time_taken_ms,
        v_now
    );

    -- 9. Cập nhật room_players
    UPDATE room_players
    SET score = score + v_total_points,
        streak = v_new_streak,
        correct_answers_count = correct_answers_count + CASE WHEN v_is_correct THEN 1 ELSE 0 END,
        status = 'submitted',
        last_seen_at = v_now
    WHERE id = v_player.id;

    -- 10. Cập nhật attempt
    UPDATE attempts
    SET score = score + v_total_points,
        total_correct = total_correct + CASE WHEN v_is_correct THEN 1 ELSE 0 END
    WHERE id = v_attempt_id;

    RETURN jsonb_build_object(
        'success', true,
        'is_correct', v_is_correct,
        'points_awarded', v_total_points,
        'speed_bonus', v_speed_bonus,
        'current_streak', v_new_streak,
        'total_score', v_player.score + v_total_points
    );
END;
$$;

-- 4. Hàm chuyển câu tiếp theo nguyên tử (advance_room_question_atomic)
CREATE OR REPLACE FUNCTION advance_room_question_atomic(
    p_room_id UUID,
    p_host_guest_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room RECORD;
    v_next_idx INT;
    v_next_q RECORD;
    v_now TIMESTAMPTZ := NOW();
    v_deadline TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ROOM_NOT_FOUND');
    END IF;

    IF v_room.host_guest_id != p_host_guest_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN_NOT_HOST');
    END IF;

    v_next_idx := v_room.current_question_index + 1;

    -- Nếu đã hết câu hỏi, tự động kết thúc phòng
    IF v_next_idx >= v_room.total_questions THEN
        UPDATE rooms 
        SET status = 'finished', finished_at = v_now 
        WHERE id = p_room_id;

        -- Tính thứ hạng cuối cùng cho các attempts
        WITH ranked_players AS (
            SELECT guest_id, RANK() OVER (ORDER BY score DESC, correct_answers_count DESC) as rnk
            FROM room_players
            WHERE room_id = p_room_id
        )
        UPDATE attempts a
        SET final_rank = rp.rnk, finished_at = v_now
        FROM ranked_players rp
        WHERE a.room_id = p_room_id AND a.guest_id = rp.guest_id;

        RETURN jsonb_build_object(
            'success', true, 
            'status', 'finished', 
            'current_question_index', v_next_idx
        );
    END IF;

    -- Lấy thông tin câu tiếp theo
    SELECT * INTO v_next_q FROM room_questions 
    WHERE room_id = p_room_id AND order_index = v_next_idx;

    v_deadline := v_now + (v_next_q.time_limit_seconds || ' seconds')::INTERVAL;

    -- Cập nhật trạng thái phòng sang câu hỏi mới
    UPDATE rooms
    SET status = 'in_progress',
        current_question_index = v_next_idx,
        question_started_at = v_now,
        question_deadline_at = v_deadline,
        started_at = COALESCE(started_at, v_now)
    WHERE id = p_room_id;

    -- Đặt lại trạng thái người chơi sang 'answering'
    UPDATE room_players
    SET status = 'answering'
    WHERE room_id = p_room_id;

    RETURN jsonb_build_object(
        'success', true,
        'status', 'in_progress',
        'current_question_index', v_next_idx,
        'question_id', v_next_q.id,
        'time_limit_seconds', v_next_q.time_limit_seconds,
        'started_at', v_now,
        'deadline_at', v_deadline
    );
END;
$$;
