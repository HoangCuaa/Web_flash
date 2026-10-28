-- 003_rls_policies.sql
-- Kích hoạt Row Level Security (RLS) bảo vệ dữ liệu ở tầng PostgreSQL

-- 1. Kích hoạt RLS cho toàn bộ các bảng
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Chính sách cho Quizzes: Khách vãng lai chỉ được đọc các Quiz công khai
DROP POLICY IF EXISTS "Public quizzes are viewable by everyone" ON quizzes;
CREATE POLICY "Public quizzes are viewable by everyone"
    ON quizzes FOR SELECT
    USING (is_public = true);

-- 3. Chính sách cho Questions và Question Options:
-- Không cho phép public đọc trực tiếp question_options có trường is_correct = true
DROP POLICY IF EXISTS "Public can view questions of public quizzes" ON questions;
CREATE POLICY "Public can view questions of public quizzes"
    ON questions FOR SELECT
    USING (EXISTS (SELECT 1 FROM quizzes WHERE quizzes.id = questions.quiz_id AND quizzes.is_public = true));

-- 4. Bảng Rooms & Room Players:
-- Cho phép đọc phòng qua room code hợp lệ
DROP POLICY IF EXISTS "Public can view active rooms" ON rooms;
CREATE POLICY "Public can view active rooms"
    ON rooms FOR SELECT
    USING (status != 'cancelled');

DROP POLICY IF EXISTS "Public can view players in room" ON room_players;
CREATE POLICY "Public can view players in room"
    ON room_players FOR SELECT
    USING (true);

-- 5. Cho phép Backend Vercel Serverless Functions sử dụng service_role toàn quyền
-- Lưu ý: Khi backend kết nối bằng SUPABASE_SERVICE_ROLE_KEY, Supabase mặc định bypass RLS.
-- Các chính sách trên bảo vệ trường hợp người dùng vô tình cấu hình anon key ở client.
