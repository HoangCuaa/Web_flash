-- 001_initial_schema.sql
-- Nền tảng Quiz Online Multiplayer - PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Bảng Khách / Người chơi ẩn danh
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash của token bí mật
    nickname VARCHAR(50) NOT NULL,
    recovery_code_hash VARCHAR(64), -- SHA-256 hash của recovery code tùy chọn
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_token_hash ON guests(token_hash);
CREATE INDEX IF NOT EXISTS idx_guests_recovery_code ON guests(recovery_code_hash);

-- 2. Bảng Bộ Quiz
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'General',
    is_public BOOLEAN NOT NULL DEFAULT true,
    time_per_question INT NOT NULL DEFAULT 20, -- giây
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_public ON quizzes(is_public);
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(category);

-- 3. Bảng Câu hỏi
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice', 'true_false'
    explanation TEXT,
    points INT NOT NULL DEFAULT 100,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);

-- 4. Bảng Lựa chọn của câu hỏi
CREATE TABLE IF NOT EXISTS question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_question_options_question_id ON question_options(question_id);

-- 5. Bảng Phòng chơi (Rooms)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(8) NOT NULL UNIQUE,
    host_guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'in_progress', 'finished', 'cancelled'
    max_players INT NOT NULL DEFAULT 20,
    time_per_question INT NOT NULL DEFAULT 20,
    current_question_index INT NOT NULL DEFAULT -1,
    question_started_at TIMESTAMPTZ,
    question_deadline_at TIMESTAMPTZ,
    total_questions INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_host_guest_id ON rooms(host_guest_id);

-- 6. Bảng Người chơi trong phòng (Room Players)
CREATE TABLE IF NOT EXISTS room_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    nickname VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'joined', -- 'joined', 'ready', 'answering', 'submitted', 'finished', 'disconnected'
    score INT NOT NULL DEFAULT 0,
    streak INT NOT NULL DEFAULT 0,
    correct_answers_count INT NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_room_guest UNIQUE(room_id, guest_id),
    CONSTRAINT uq_room_nickname UNIQUE(room_id, nickname)
);

CREATE INDEX IF NOT EXISTS idx_room_players_room_id ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_room_players_leaderboard ON room_players(room_id, score DESC, last_seen_at ASC);

-- 7. Bảng Snapshot câu hỏi của phòng (Không phụ thuộc vào sửa đổi quiz sau này)
CREATE TABLE IF NOT EXISTS room_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    order_index INT NOT NULL,
    content TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL DEFAULT 'multiple_choice',
    points INT NOT NULL DEFAULT 100,
    time_limit_seconds INT NOT NULL DEFAULT 20,
    explanation TEXT,
    CONSTRAINT uq_room_question_order UNIQUE(room_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_room_questions_room_id ON room_questions(room_id);

-- 8. Bảng Snapshot lựa chọn cho câu hỏi phòng
CREATE TABLE IF NOT EXISTS room_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_question_id UUID NOT NULL REFERENCES room_questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    order_index INT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_room_q_options_rq_id ON room_question_options(room_question_id);

-- 9. Bảng Lượt thi của từng người chơi (Attempts)
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    score INT NOT NULL DEFAULT 0,
    total_correct INT NOT NULL DEFAULT 0,
    total_questions INT NOT NULL DEFAULT 0,
    final_rank INT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    CONSTRAINT uq_room_guest_attempt UNIQUE(room_id, guest_id)
);

CREATE INDEX IF NOT EXISTS idx_attempts_guest_id ON attempts(guest_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_quiz_id ON attempts(quiz_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_room_id ON attempts(room_id, score DESC);

-- 10. Bảng Chi tiết câu trả lời (Answers)
CREATE TABLE IF NOT EXISTS answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    room_question_id UUID NOT NULL REFERENCES room_questions(id) ON DELETE RESTRICT,
    selected_option_id UUID REFERENCES room_question_options(id) ON DELETE SET NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_awarded INT NOT NULL DEFAULT 0,
    time_taken_ms INT NOT NULL DEFAULT 0,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attempt_question UNIQUE(attempt_id, room_question_id)
);

CREATE INDEX IF NOT EXISTS idx_answers_attempt ON answers(attempt_id);

-- 11. Bảng Khóa Idempotency chống duplicate request
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key VARCHAR(128) PRIMARY KEY,
    response_status INT NOT NULL,
    response_body JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);

-- 12. Bảng Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    actor_type VARCHAR(20) NOT NULL, -- 'guest', 'host', 'admin', 'system'
    actor_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
