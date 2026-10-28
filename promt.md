# MASTER PROMPT: XÂY DỰNG BACKEND VÀ REST API CHO NỀN TẢNG QUIZ ONLINE NHIỀU NGƯỜI CHƠI

## 1. VAI TRÒ VÀ MỤC TIÊU

Bạn là Senior Backend Engineer, Database Architect và Application Security Engineer, có kinh nghiệm thiết kế hệ thống quiz trực tuyến, multiplayer, real-time, PostgreSQL, Supabase, Node.js và Vercel Serverless Functions.

Hãy thiết kế và triển khai một backend hoàn chỉnh cho nền tảng quiz trực tuyến nhiều người chơi.

Tôi đã có frontend riêng được xây dựng bằng HTML, CSS và JavaScript thuần, hiện đang triển khai trên Vercel. Tôi sẽ tự tích hợp frontend với backend sau khi nhận được mã nguồn và tài liệu API.

Vì vậy, phạm vi công việc của bạn tập trung vào BACKEND, DATABASE, REST API, REALTIME, SECURITY, TESTING, DEPLOYMENT và DOCUMENTATION.

Không viết lại frontend. Không tự ý yêu cầu sử dụng React, Next.js hoặc một framework frontend khác.

Mục tiêu là xây dựng một backend có thể triển khai thực tế, dễ bảo trì, dễ mở rộng, tiết kiệm chi phí ban đầu và có khả năng phục vụ nhiều người truy cập đồng thời.

Không chỉ đưa ra ví dụ minh họa hoặc pseudocode. Hãy tạo mã nguồn thực tế, đầy đủ, nhất quán giữa các module và có thể chạy sau khi cấu hình các biến môi trường cần thiết.

---

## 2. CÔNG NGHỆ BẮT BUỘC

Sử dụng kiến trúc sau:

- Frontend hiện có: HTML, CSS, JavaScript thuần, tiếp tục chạy trên Vercel.
- Backend API: Node.js trên Vercel Functions, sử dụng JavaScript ES Modules.
- Database: PostgreSQL thông qua Supabase.
- Database client: `@supabase/supabase-js`.
- Realtime: Supabase Realtime, có phân quyền truy cập rõ ràng.
- Validation: Zod hoặc một thư viện validation tương đương.
- Testing: Vitest hoặc công cụ phù hợp với stack được lựa chọn.
- API format: REST API sử dụng JSON.
- API documentation: OpenAPI 3.1, kèm tài liệu hướng dẫn sử dụng.
- Database migration: SQL migration có thể chạy theo thứ tự và quản lý bằng Git.
- Logging: Structured logging, không ghi token, mật khẩu, đáp án bí mật hoặc dữ liệu nhạy cảm vào log.

Không cần xây dựng một server VPS riêng trong giai đoạn đầu.

Không dùng file JSON, file local, biến toàn cục trong bộ nhớ hoặc filesystem của serverless function để lưu dữ liệu nghiệp vụ. Các dữ liệu cần tồn tại lâu dài phải được lưu trong PostgreSQL.

Không sử dụng localStorage hoặc sessionStorage làm database. Client chỉ có thể dùng chúng để lưu thông tin phiên tạm thời khi cần.

Trước khi viết code, hãy kiểm tra tài liệu chính thức hiện hành của Supabase, PostgreSQL và Vercel để bảo đảm API, cấu hình và cách triển khai phù hợp với phiên bản đang được hỗ trợ. Không tự bịa API hoặc sử dụng cấu hình đã lỗi thời.

---

## 3. NGUYÊN TẮC KIẾN TRÚC

Thiết kế theo các nguyên tắc:

1. Frontend không được truy cập bằng quyền quản trị database.
2. Tất cả thao tác quan trọng như tạo phòng, bắt đầu trận, nộp đáp án, tính điểm, kết thúc trận và ghi nhận kết quả phải được backend xác thực.
3. Server là nguồn dữ liệu có thẩm quyền đối với điểm số, thời gian và trạng thái trận đấu.
4. Các thao tác quan trọng phải có tính nguyên tử, tránh cập nhật dở dang.
5. Hỗ trợ idempotency cho những request có thể được gửi lại do timeout hoặc mất kết nối.
6. Dùng transaction hoặc PostgreSQL functions/RPC phù hợp cho các nghiệp vụ nhiều bước cần tính nhất quán.
7. Mọi truy vấn phải giới hạn dữ liệu trả về, sử dụng pagination và index thích hợp.
8. Phân quyền theo phòng, người chơi, chủ phòng và quyền quản trị.
9. Không tin tưởng bất kỳ dữ liệu điểm số, thời gian hoặc quyền hạn nào do client tự khai báo.
10. Tách biệt câu trả lời đúng, dữ liệu quản trị và dữ liệu công khai.
11. API phải có cấu trúc lỗi nhất quán và không tiết lộ thông tin nội bộ.
12. Không tạo tính năng giả hoặc trả về dữ liệu hardcode thay cho database thật.

Hãy ưu tiên kiến trúc đơn giản nhưng an toàn. Không tự ý thêm microservices, Redis, Kubernetes hoặc message broker khi chưa có nhu cầu thực tế được chứng minh.

---

## 4. CHỨC NĂNG NGHIỆP VỤ

### 4.1. Người chơi không cần tài khoản

Người chơi có thể tham gia bằng biệt danh, không bắt buộc đăng ký hoặc đăng nhập tài khoản.

Khi người chơi tham gia, backend tạo một định danh người chơi và một credential ngẫu nhiên có entropy đủ mạnh.

Credential phải được:

- Sinh bằng bộ tạo số ngẫu nhiên an toàn về mật mã.
- Gửi cho client đúng thời điểm cần thiết.
- Chỉ lưu bản hash hoặc dạng verifier phù hợp trong database.
- Xác minh ở backend trong những request cần quyền của người chơi.
- Không ghi vào log.
- Không được phép thay thế bằng player ID, nickname hoặc room code.

Nếu phù hợp, sử dụng token riêng cho chủ phòng và token riêng cho từng người chơi.

Không xem room code là một yếu tố xác thực.

Đối với người chơi ẩn danh, cần mô tả rõ hạn chế khi đổi thiết bị, xóa dữ liệu trình duyệt hoặc mất token. Thiết kế phương án khôi phục bằng mã khôi phục tùy chọn nếu có thể, nhưng không bắt buộc người dùng phải đăng ký tài khoản.

Nickname phải được kiểm tra độ dài, chuẩn hóa Unicode ở mức hợp lý và xử lý các ký tự không phù hợp. Có chính sách xử lý tên trùng trong cùng phòng. Không coi nickname là danh tính duy nhất.

### 4.2. Tạo phòng quiz

Chủ phòng có thể:

- Tạo phòng bằng API.
- Nhận mã phòng ngắn, dễ chia sẻ.
- Chọn bộ câu hỏi hoặc quiz.
- Thiết lập số người chơi tối đa.
- Thiết lập thời gian trả lời.
- Thiết lập số câu hỏi hoặc số vòng.
- Thiết lập chế độ công khai hoặc riêng tư nếu cần.
- Thiết lập thời gian chờ bắt đầu.
- Bắt đầu trận khi đáp ứng điều kiện.
- Kết thúc hoặc hủy phòng khi có quyền.

Room code phải được tạo bằng nguồn ngẫu nhiên đủ mạnh, có unique constraint và cơ chế thử lại khi va chạm.

Có giới hạn số người chơi mỗi phòng và giới hạn số phòng được tạo bởi một nguồn truy cập trong một khoảng thời gian.

### 4.3. Tham gia phòng

Người chơi nhập room code và nickname để tham gia.

Backend phải kiểm tra:

- Phòng có tồn tại hay không.
- Trạng thái phòng có cho phép tham gia không.
- Phòng có đầy người hay không.
- Nickname có hợp lệ không.
- Người chơi đã tham gia phòng hay chưa.
- Có vượt giới hạn request không.
- Phòng có yêu cầu điều kiện tham gia đặc biệt hay không.

Trả về dữ liệu tối thiểu cần thiết để client hiển thị phòng chờ.

Không trả về credential của người khác, câu trả lời đúng, token chủ phòng hoặc thông tin nội bộ.

Hỗ trợ người chơi tải lại trang hoặc kết nối lại bằng credential hợp lệ.

### 4.4. Phòng chờ và trạng thái người chơi

Hỗ trợ các trạng thái cần thiết:

- Waiting: đang chờ người chơi.
- Playing: đang diễn ra.
- Finished: đã hoàn thành.
- Cancelled: đã hủy, nếu cần.

Trạng thái người chơi có thể bao gồm:

- Joined.
- Ready.
- Answering.
- Submitted.
- Finished.
- Disconnected, nếu có cơ chế theo dõi kết nối.

Phân biệt trạng thái kết nối realtime với trạng thái lưu trữ bền vững. Không đánh dấu người chơi rời phòng chỉ vì một sự kiện mạng bị mất.

Chỉ chủ phòng hoặc người có quyền hợp lệ mới được bắt đầu hoặc điều khiển trận đấu.

### 4.5. Quản lý câu hỏi

Hỗ trợ các dạng câu hỏi:

- Trắc nghiệm một đáp án.
- Đúng/Sai.
- Các dạng khác có thể mở rộng về sau.

Mỗi câu hỏi có thể chứa:

- ID.
- Nội dung.
- Danh sách lựa chọn.
- Loại câu hỏi.
- Điểm tối đa.
- Thứ tự hiển thị.
- Giải thích đáp án sau khi nộp.
- Trạng thái hoạt động.
- Thời gian trả lời.
- Metadata cần thiết.

Đáp án đúng phải được lưu riêng hoặc được bảo vệ bằng quyền truy cập thích hợp.

Không để client tải trước đáp án đúng nếu điều đó cho phép người chơi xem nguồn dữ liệu và gian lận.

Backend chỉ trả về câu hỏi và lựa chọn được phép công khai tại thời điểm tương ứng.

Có thể hỗ trợ quản trị viên tạo, sửa, xóa hoặc nhập câu hỏi bằng JSON/CSV ở giai đoạn sau.

Không bắt buộc xây dựng giao diện quản trị frontend; chỉ cần thiết kế API và phân quyền backend.

### 4.6. Vòng đời trận đấu

Thiết kế quy trình trạng thái có kiểm soát:

- Tạo phòng.
- Tham gia phòng.
- Chờ bắt đầu.
- Bắt đầu trận.
- Phát hành câu hỏi theo thứ tự.
- Nhận đáp án.
- Chấm điểm.
- Kết thúc lượt trả lời.
- Chuyển câu tiếp theo.
- Hoàn thành trận.
- Công bố bảng xếp hạng.
- Lưu lịch sử cuối trận.

Các chuyển đổi trạng thái phải được xác thực ở server và không cho phép chuyển trạng thái tùy ý.

Không dựa vào đồng hồ client để xác định ai trả lời đúng hạn.

Server phải xác định thời điểm bắt đầu câu hỏi, hạn nộp đáp án và thời điểm nhận request. Quy định rõ cách xử lý độ trễ mạng, request đến sát thời hạn và request bị retry.

Nếu serverless function không duy trì bộ nhớ giữa các request, không dựa vào `setTimeout`, biến global hoặc tiến trình chạy nền để quản lý trận đấu.

Sử dụng timestamp trong database và các thao tác nguyên tử để xác định trạng thái có hiệu lực. Nếu cần tự động chuyển câu hoặc kết thúc trận mà không có client hoạt động, hãy thiết kế một cơ chế scheduler/cron phù hợp với khả năng của Vercel, hoặc nêu rõ giới hạn và cách khắc phục.

### 4.7. Chấm điểm

Điểm phải được tính tại server.

Hỗ trợ:

- Điểm cơ bản cho câu đúng.
- Điểm bằng 0 cho câu sai hoặc bỏ qua.
- Câu trả lời đúng hạn.
- Xử lý nộp bài nhiều lần.
- Xử lý request đồng thời.
- Chống cộng điểm hai lần.
- Tính số câu đúng và tổng số câu.
- Thời gian hoàn thành.
- Tie-break rõ ràng khi bằng điểm.

Có thể hỗ trợ điểm thưởng theo tốc độ nếu phù hợp, nhưng công thức phải được định nghĩa rõ, kiểm thử được và không cho phép client tự gửi điểm thưởng.

Câu trả lời đúng phải được xác định từ dữ liệu server. Không nhận các trường `score`, `is_correct`, `points_earned` do client gửi như giá trị có thẩm quyền.

Đảm bảo thao tác ghi câu trả lời, tính điểm và cập nhật tổng điểm có tính nguyên tử.

### 4.8. Lịch sử thi

Lưu lịch sử bền vững cho từng lượt thi, bao gồm:

- Người chơi.
- Phòng.
- Bộ quiz.
- Thời gian bắt đầu và kết thúc.
- Tổng điểm.
- Số câu đúng.
- Tổng số câu.
- Thứ hạng cuối cùng.
- Các câu trả lời đã chọn.
- Trạng thái câu trả lời.
- Điểm từng câu.
- Thời điểm trả lời.
- Thời gian phản hồi nếu được tính.
- Thông tin cần thiết để giải thích kết quả.

Cho phép người chơi truy vấn lịch sử thuộc về mình bằng credential hợp lệ.

Không cho phép người chơi sửa hoặc xóa lịch sử thi đã hoàn thành thông qua API công khai.

Có pagination, giới hạn page size và bộ lọc theo thời gian, quiz hoặc phòng.

Không lưu các thông tin nhạy cảm không cần thiết.

### 4.9. Bảng xếp hạng

Xây dựng các loại bảng xếp hạng:

1. Bảng xếp hạng trong phòng.
2. Bảng xếp hạng của một quiz.
3. Bảng xếp hạng toàn hệ thống.
4. Bảng xếp hạng theo ngày, tuần hoặc mùa thi nếu cần.

Định nghĩa rõ quy tắc xếp hạng, ví dụ:

- Điểm cao hơn đứng trước.
- Nếu bằng điểm, ưu tiên thời gian hoàn thành ngắn hơn.
- Nếu vẫn bằng nhau, sử dụng quy tắc ổn định đã công bố.

Phải xác định một trong các phương pháp tổng hợp sau cho leaderboard toàn hệ thống:

- Điểm cao nhất của mỗi người.
- Tổng điểm của các lượt hợp lệ.
- Thành tích tốt nhất theo từng quiz.
- Điểm tích lũy theo mùa.

Không cộng điểm của tất cả lượt thi một cách mặc định nếu điều đó tạo lợi thế cho người chơi làm đi làm lại.

Leaderboard chỉ hiển thị các trường công khai như nickname, điểm, thứ hạng và thành tích cần thiết.

Không trả về token hoặc toàn bộ câu trả lời của người chơi khác.

Có index phù hợp, pagination và caching khi dữ liệu lớn.

### 4.10. Thi đấu nhiều người theo phòng

Hỗ trợ nhiều người tham gia cùng một phòng và đồng bộ trạng thái gần thời gian thực.

Thiết kế cơ chế để:

- Hiển thị danh sách người chơi.
- Thông báo người mới tham gia.
- Đồng bộ trạng thái sẵn sàng.
- Đồng bộ câu hỏi đang diễn ra.
- Nhận kết quả nộp bài.
- Công bố điểm sau thời điểm phù hợp.
- Đồng bộ trạng thái kết thúc trận.
- Hỗ trợ reconnect.

Không cần gửi toàn bộ dữ liệu phòng mỗi khi có một thay đổi nhỏ.

Realtime chỉ truyền dữ liệu cần thiết. Không broadcast credential, đáp án bí mật hoặc thông tin nội bộ.

Phân quyền channel và quyền subscribe. Không cho phép người chơi tự do nghe dữ liệu riêng tư của phòng khác chỉ bằng cách đoán mã.

Thiết kế phương án fallback bằng API polling khi Realtime bị mất kết nối.

Nếu có leaderboard cập nhật trực tiếp, cần bảo đảm sự kiện Realtime không trở thành nguồn xác thực duy nhất; dữ liệu chính thức phải được đọc từ database hoặc API có phân quyền.

---

## 5. DATABASE SCHEMA

Thiết kế schema PostgreSQL chuẩn hóa, có foreign key, unique constraint, check constraint, index và migration.

Tối thiểu cần xem xét các bảng sau:

### `profiles` hoặc `guests`

Thông tin người chơi ẩn danh và định danh bền vững phù hợp với mô hình credential.

### `rooms`

Thông tin phòng:

- ID.
- Room code.
- Chủ phòng.
- Trạng thái.
- Cấu hình trận.
- Số người tối đa.
- Thời gian tạo.
- Thời gian bắt đầu.
- Thời gian kết thúc.
- Quiz được sử dụng.

### `room_players`

Liên kết người chơi với phòng:

- Room ID.
- Player ID.
- Nickname tại thời điểm thi.
- Trạng thái.
- Thời gian tham gia.
- Thời gian rời phòng nếu có.
- Credential verifier hoặc cơ chế xác thực được thiết kế phù hợp.

### `quizzes`

Thông tin bộ quiz, mô tả, cấu hình và trạng thái.

### `questions`

Nội dung câu hỏi, loại câu hỏi, metadata và trạng thái.

### `question_options`

Nếu phù hợp, tách lựa chọn thành bảng riêng thay vì lưu tất cả trong một JSONB không có cấu trúc.

### `quiz_questions`

Liên kết quiz với câu hỏi, thứ tự và điểm tương ứng.

### `room_questions`

Ảnh chụp bộ câu hỏi được sử dụng trong một trận, tránh việc chỉnh sửa quiz làm thay đổi kết quả lịch sử.

### `attempts`

Thông tin lượt thi của từng người chơi.

### `answers`

Chi tiết đáp án của từng câu trong lượt thi.

### `leaderboard_entries` hoặc các view/query tương ứng

Chỉ tạo bảng tổng hợp khi cần thiết. Nếu dữ liệu chưa lớn, ưu tiên query hoặc view có index thích hợp thay vì lưu trùng lặp dữ liệu không cần thiết.

### `idempotency_keys`

Lưu kết quả của các request quan trọng nếu cần chống xử lý lặp khi retry.

### `audit_logs`

Chỉ dùng khi cần ghi nhận sự kiện quản trị hoặc hành vi quan trọng. Không lưu credential hoặc thông tin nhạy cảm vào bảng log.

Bạn được phép điều chỉnh cấu trúc để tốt hơn, nhưng phải giải thích lý do và cung cấp đầy đủ migration.

Đặc biệt phải xử lý:

- Xóa hoặc lưu trữ dữ liệu liên quan khi xóa phòng.
- Không làm mất lịch sử khi bộ quiz thay đổi.
- Không để hai request đồng thời tạo ra hai lượt thi không hợp lệ.
- Không để hai câu trả lời cùng một câu hỏi ghi nhận điểm hai lần.
- Index cho room code, trạng thái phòng, room ID, player ID, attempt ID và truy vấn leaderboard.
- Chiến lược dọn dữ liệu hết hạn và phòng không hoạt động.
- Chính sách retention rõ ràng, không tự xóa lịch sử hợp lệ quá sớm.

---

## 6. REST API

Thiết kế API có version prefix `/api/v1`.

Tất cả request và response dùng JSON UTF-8.

Sử dụng HTTP status code phù hợp, schema request rõ ràng, error code ổn định và validation đầy đủ.

Tối thiểu triển khai các endpoint sau:

### Guest / Player

- `POST /api/v1/guests`
  Tạo định danh khách hoặc credential theo mô hình được chọn.

- `POST /api/v1/guests/recover`
  Khôi phục danh tính bằng mã khôi phục tùy chọn nếu tính năng này được triển khai.

- `GET /api/v1/players/me`
  Trả về thông tin người chơi đang được xác thực.

- `GET /api/v1/players/me/history`
  Truy vấn lịch sử thi của người chơi.

- `GET /api/v1/players/me/history/:attemptId`
  Xem chi tiết một lượt thi thuộc về mình.

### Room

- `POST /api/v1/rooms`
  Tạo phòng.

- `GET /api/v1/rooms/:roomCode`
  Lấy thông tin công khai của phòng.

- `POST /api/v1/rooms/:roomCode/join`
  Tham gia phòng.

- `POST /api/v1/rooms/:roomCode/ready`
  Cập nhật trạng thái sẵn sàng.

- `POST /api/v1/rooms/:roomCode/leave`
  Rời phòng.

- `POST /api/v1/rooms/:roomCode/start`
  Chủ phòng bắt đầu trận.

- `POST /api/v1/rooms/:roomCode/cancel`
  Hủy phòng khi có quyền.

- `POST /api/v1/rooms/:roomCode/next-question`
  Chuyển câu nếu mô hình trận đấu cho phép chủ phòng điều khiển.

- `GET /api/v1/rooms/:roomCode/players`
  Lấy danh sách người chơi được phép hiển thị.

- `GET /api/v1/rooms/:roomCode/state`
  Lấy trạng thái trận hiện tại để reconnect.

### Questions / Gameplay

- `GET /api/v1/rooms/:roomCode/current-question`
  Lấy câu hỏi hiện tại, không bao gồm đáp án đúng.

- `POST /api/v1/rooms/:roomCode/answers`
  Nộp câu trả lời.

- `POST /api/v1/rooms/:roomCode/skip`
  Bỏ qua câu nếu luật chơi cho phép.

- `GET /api/v1/rooms/:roomCode/results`
  Lấy kết quả công khai khi được phép công bố.

### Leaderboard

- `GET /api/v1/rooms/:roomCode/leaderboard`
  Bảng xếp hạng trong phòng.

- `GET /api/v1/quizzes/:quizId/leaderboard`
  Bảng xếp hạng theo quiz.

- `GET /api/v1/leaderboard/global`
  Bảng xếp hạng toàn hệ thống.

- `GET /api/v1/leaderboard/daily`
  Bảng xếp hạng theo ngày nếu được triển khai.

### Quiz Management

- `GET /api/v1/quizzes`
  Danh sách quiz được công khai.

- `GET /api/v1/quizzes/:quizId`
  Thông tin quiz được phép công khai.

- `POST /api/v1/admin/quizzes`
  Tạo quiz với quyền quản trị.

- `POST /api/v1/admin/questions/import`
  Nhập câu hỏi bằng JSON/CSV nếu phù hợp.

Các endpoint quản trị phải được bảo vệ bằng cơ chế xác thực riêng, không dựa vào việc người dùng biết một URL bí mật.

Bạn được phép thay đổi endpoint khi có lý do kỹ thuật hợp lý, nhưng phải cung cấp bảng ánh xạ endpoint và giải thích đầy đủ.

---

## 7. CHUẨN RESPONSE VÀ ERROR HANDLING

Thống nhất response thành công, ví dụ:

{
  "success": true,
  "data": {
    "id": "example-id"
  },
  "meta": {}
}

Thống nhất response lỗi, ví dụ:

{
  "success": false,
  "error": {
    "code": "ROOM_NOT_FOUND",
    "message": "Không tìm thấy phòng",
    "details": {}
  },
  "requestId": "request-id"
}

Không bắt buộc sử dụng đúng cấu trúc trên nếu có phương án tốt hơn, nhưng phải nhất quán trên toàn hệ thống.

Phân biệt các lỗi:

- Validation error.
- Room not found.
- Room full.
- Room already started.
- Invalid credential.
- Permission denied.
- Answer deadline exceeded.
- Duplicate submission.
- Rate limit exceeded.
- Conflict.
- Database unavailable.
- Internal server error.

Không trả stack trace hoặc thông tin bí mật cho client.

Dùng request ID để truy vết lỗi ở server.

---

## 8. BẢO MẬT VÀ CHỐNG GIAN LẬN

Đây là yêu cầu bắt buộc, không được xem là tính năng tùy chọn.

### Credential và quyền truy cập

- Sử dụng cryptographically secure random token.
- Lưu hash/verifier thay vì token thô trong database.
- Không dùng UUID người chơi như một credential bí mật.
- Không dùng room code làm credential.
- Xác thực quyền chủ phòng và người chơi cho từng thao tác.
- Phân biệt quyền guest, player, host và admin.
- Token không được xuất hiện trong log, error message hoặc Realtime payload.
- Hỗ trợ thu hồi credential khi cần.

### Chống gian lận

- Điểm được tính phía server.
- Không gửi đáp án đúng trước khi được phép.
- Không tin thời gian và trạng thái do client tự khai báo.
- Chặn nộp đáp án sau thời hạn.
- Chặn request nộp đáp án lặp.
- Chống race condition.
- Chống sửa kết quả thông qua API.
- Chống truy cập lịch sử của người khác.
- Không cho người chơi thay đổi owner hoặc quyền phòng.
- Không cho người chơi tự ý thay đổi `room_id`, `player_id` hoặc `attempt_id` để vượt quyền.
- Kiểm tra quyền trước khi truy vấn dữ liệu.

### Network và API

- Rate limiting cho tạo phòng, tham gia phòng, nộp đáp án và khôi phục credential.
- Giới hạn kích thước request.
- Validate tất cả input.
- Dùng query parameterization, tránh SQL injection.
- Kiểm soát CORS theo origin được cấu hình; không coi CORS là cơ chế xác thực.
- Không trả dữ liệu quá mức cần thiết.
- Chống brute-force room code và dò credential.
- Có giới hạn số người chơi, số request và thời gian xử lý phù hợp.
- Xử lý lỗi Supabase an toàn.

### Database

- Bật RLS trên các bảng có thể được truy cập qua Supabase API.
- Không sử dụng service-role key ở frontend.
- Nếu backend sử dụng service-role key, phải tự kiểm tra quyền ở mọi endpoint.
- Ưu tiên PostgreSQL functions có `SECURITY INVOKER` khi có thể; nếu cần `SECURITY DEFINER`, phải khóa chặt `search_path`, kiểm tra quyền thực thi và không để người dùng gọi trực tiếp một hàm có đặc quyền mà chưa xác thực.
- Không mở quyền đọc/ghi toàn bộ bảng chỉ để Realtime hoạt động.
- Chỉ công bố những trường thực sự cần thiết.

Hãy cung cấp các kịch bản kiểm thử bảo mật để xác minh những biện pháp trên.

---

## 9. REALTIME VÀ ĐỒNG BỘ

Sử dụng Supabase Realtime nếu phù hợp.

Thiết kế các sự kiện hoặc cơ chế đồng bộ cho:

- Người chơi tham gia.
- Người chơi sẵn sàng.
- Trận bắt đầu.
- Câu hỏi mới.
- Người chơi nộp bài.
- Công bố điểm.
- Trận kết thúc.
- Leaderboard cập nhật.

Chỉ phát những dữ liệu người nhận được phép xem.

Không gửi đáp án đúng hoặc credential trong các event.

Phải có phương án reconnect:

1. Client kết nối lại.
2. Gọi API lấy trạng thái hiện tại.
3. Đăng ký Realtime.
4. Đồng bộ lại khi mất event hoặc khi có sự khác biệt.

Không coi Realtime là nguồn dữ liệu duy nhất. PostgreSQL vẫn là nguồn dữ liệu chính thức.

Nếu dùng Supabase Broadcast, Presence hoặc Postgres Changes, hãy lựa chọn theo nhu cầu thực tế, giải thích trade-off và cấu hình quyền cụ thể.

Không giả định mọi event được gửi đúng một lần hoặc theo thứ tự tuyệt đối.

---

## 10. TỐI ƯU HIỆU NĂNG VÀ KHẢ NĂNG MỞ RỘNG

Mục tiêu là phục vụ nhiều người truy cập mà không tăng chi phí không cần thiết.

Không tự khẳng định một số lượng người dùng tối đa khi chưa có benchmark.

Thiết kế theo các nguyên tắc:

- Tối ưu SQL và tránh N+1 queries.
- Dùng index phù hợp với query thực tế.
- Giới hạn số dòng và kích thước response.
- Pagination cho history và leaderboard.
- Không tải toàn bộ câu hỏi hoặc lịch sử trong một request.
- Không query liên tục chỉ để kiểm tra trạng thái nếu Realtime đáp ứng tốt hơn.
- Có polling fallback với chu kỳ hợp lý.
- Không tạo một channel Realtime mới cho mọi thao tác nhỏ nếu không cần.
- Xử lý reconnect và unsubscribe đúng cách.
- Caching chỉ áp dụng cho dữ liệu có thể cache an toàn.
- Không cache dữ liệu cá nhân hoặc dữ liệu riêng tư ở nơi công khai.
- Có timeout, xử lý retry và exponential backoff hợp lý.
- Chỉ retry những thao tác an toàn hoặc có idempotency.
- Không giữ database transaction mở trong khi chờ thao tác mạng bên ngoài.
- Tránh quét toàn bảng và các truy vấn không có giới hạn.
- Có cơ chế dọn phòng hết hạn mà không xóa lịch sử hợp lệ.
- Thiết kế tương thích với giới hạn thời gian chạy, concurrency và cấu hình của Vercel Functions.

Hãy đề xuất các kịch bản benchmark cho 50, 100, 500 và 1.000 người chơi đồng thời nếu ngân sách và môi trường cho phép. Những con số này là các mức kiểm thử mục tiêu, không phải cam kết hệ thống có thể chịu tải trước khi đo thực tế.

Báo cáo những nút thắt có khả năng xảy ra và cách đo chúng bằng log, metrics và công cụ kiểm thử tải.

Không thêm Redis hoặc các dịch vụ đắt tiền nếu chưa chứng minh được nhu cầu.

---

## 11. BIẾN MÔI TRƯỜNG VÀ TRIỂN KHAI

Tạo file `.env.example` chỉ chứa placeholder.

Tối thiểu xem xét:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` hoặc secret key backend tương đương.
- `SUPABASE_ANON_KEY` hoặc publishable key nếu thực sự cần.
- `APP_ORIGIN`
- `ADMIN_SECRET` hoặc cơ chế quản trị an toàn hơn.
- Các biến cấu hình rate limit, giới hạn người chơi và thời gian trận nếu cần.

Không ghi giá trị bí mật thật vào Git.

Không commit `.env`.

Tách rõ biến môi trường frontend và backend.

Nếu dùng service-role key, chỉ cấu hình ở môi trường server.

Cung cấp:

1. Hướng dẫn tạo project Supabase.
2. Hướng dẫn chạy migration.
3. Hướng dẫn tạo dữ liệu mẫu.
4. Hướng dẫn cấu hình Environment Variables trên Vercel.
5. Hướng dẫn deploy.
6. Hướng dẫn kiểm tra endpoint sau deploy.
7. Hướng dẫn xem log.
8. Hướng dẫn cập nhật schema an toàn.
9. Hướng dẫn backup và khôi phục.
10. Hướng dẫn thay đổi secret khi có sự cố.

Không tạo các lệnh có khả năng xóa database production mà không cảnh báo rõ.

---

## 12. KIỂM THỬ

Tạo test suite thực tế.

### Unit tests

- Tính điểm.
- Chuẩn hóa nickname.
- Sinh và kiểm tra room code.
- Kiểm tra deadline.
- Quy tắc xếp hạng.
- Validation request.
- Phân quyền theo role.

### Integration tests

- Tạo phòng.
- Tham gia phòng.
- Bắt đầu trận.
- Nộp đáp án.
- Lưu lịch sử.
- Tính điểm.
- Kết thúc trận.
- Đọc leaderboard.
- Đọc lịch sử của chính người chơi.
- Từ chối đọc lịch sử người khác.
- Reconnect.
- Xử lý request lặp.

### Security tests

- Gửi điểm giả.
- Gửi `is_correct: true`.
- Gửi câu hỏi không thuộc phòng.
- Gửi request bằng token người chơi khác.
- Dùng player ID thay credential.
- Gửi request sau deadline.
- Nộp cùng câu trả lời đồng thời.
- Đoán room code.
- Thử vượt quyền chủ phòng.
- Thử truy cập endpoint admin.
- Thử đọc bảng database trực tiếp qua API công khai.
- Thử truy cập đáp án đúng trước khi công bố.

### Concurrency tests

Kiểm thử hai hoặc nhiều request cùng nộp một câu trả lời, nhiều người cùng tham gia phòng và nhiều request cùng bắt đầu trận.

Phải xác minh không xảy ra duplicate answers, cộng điểm lặp hoặc trạng thái trận không hợp lệ.

Mỗi test phải có kết quả mong đợi rõ ràng.

Không được tuyên bố test đã pass nếu chưa thực sự chạy test.

---

## 13. TÀI LIỆU API

Tạo file `openapi.yaml` tương thích OpenAPI 3.1.

Mỗi endpoint phải mô tả:

- HTTP method.
- URL.
- Mục đích.
- Authentication.
- Request headers.
- Request body.
- Path/query parameters.
- Response thành công.
- Các response lỗi.
- Quy tắc validation.
- Quyền truy cập.
- Idempotency nếu có.
- Ví dụ request/response.

Tạo thêm `API.md` giải thích API bằng tiếng Việt.

Tài liệu phải đủ để một lập trình viên frontend có thể tích hợp hệ thống mà không cần đọc toàn bộ mã nguồn backend.

Cung cấp ví dụ JavaScript `fetch()` thuần cho các luồng:

1. Tạo khách.
2. Tạo phòng.
3. Tham gia phòng.
4. Đánh dấu sẵn sàng.
5. Bắt đầu trận.
6. Lấy câu hỏi.
7. Nộp đáp án.
8. Lấy trạng thái phòng.
9. Lấy leaderboard.
10. Xem lịch sử.
11. Reconnect.
12. Xử lý lỗi và retry.

Các ví dụ chỉ minh họa cách gọi API; không đưa secret key vào frontend.

---

## 14. CẤU TRÚC SOURCE CODE MONG MUỐN

Tổ chức source code rõ ràng, phù hợp với Vercel Functions và không làm phức tạp hệ thống.

Ví dụ:

backend/
├── api/
│   └── v1/
│       ├── guests/
│       ├── rooms/
│       ├── players/
│       ├── quizzes/
│       ├── leaderboard/
│       └── admin/
├── lib/
│   ├── supabase.js
│   ├── auth.js
│   ├── validation.js
│   ├── errors.js
│   ├── rate-limit.js
│   ├── logger.js
│   └── http.js
├── services/
│   ├── guest-service.js
│   ├── room-service.js
│   ├── quiz-service.js
│   ├── gameplay-service.js
│   ├── scoring-service.js
│   ├── history-service.js
│   └── leaderboard-service.js
├── db/
│   └── migrations/
├── tests/
├── openapi.yaml
├── API.md
├── package.json
├── .env.example
├── .gitignore
└── vercel.json

Bạn được phép điều chỉnh cấu trúc để tương thích tốt hơn với Vercel. Không bắt buộc phải tạo nhiều lớp hoặc nhiều file chỉ để tuân theo mẫu.

Mỗi module phải có trách nhiệm rõ ràng. Tránh tạo một file khổng lồ chứa toàn bộ logic.

Không giả định Vercel tự hiểu mọi cấu trúc thư mục lồng nhau. Hãy kiểm tra routing thực tế của Vercel Functions và cấu hình route đúng với phiên bản đang sử dụng.

---

## 15. QUY TRÌNH THỰC HIỆN

Thực hiện theo các giai đoạn sau.

### Giai đoạn A — Phân tích

Trình bày:

- Kiến trúc hệ thống.
- Sơ đồ luồng dữ liệu.
- Sơ đồ trạng thái phòng và trận.
- ERD database.
- Quy tắc xác thực.
- Quy tắc tính điểm.
- Danh sách endpoint.
- Các rủi ro kỹ thuật chính.

Nếu có chi tiết chưa được quyết định, hãy chọn phương án an toàn, hợp lý và ghi rõ giả định. Không dừng lại chỉ để hỏi những câu không thực sự cần thiết.

### Giai đoạn B — Database

Tạo toàn bộ SQL migration, constraint, index, function/RPC cần thiết, chính sách RLS và dữ liệu seed.

Đảm bảo migration có thứ tự, có thể chạy lặp an toàn khi phù hợp và không xóa dữ liệu hiện có ngoài ý muốn.

### Giai đoạn C — Backend

Viết đầy đủ các module:

- HTTP utilities.
- Validation.
- Authentication.
- Authorization.
- Room management.
- Guest/player management.
- Gameplay.
- Scoring.
- History.
- Leaderboard.
- Realtime.
- Error handling.
- Logging.
- Rate limiting.

Đảm bảo các module dùng chung một quy ước dữ liệu và không có endpoint gọi các trường database không tồn tại.

### Giai đoạn D — Testing

Tạo và chạy test. Báo cáo rõ:

- Test nào đã chạy.
- Test nào pass.
- Test nào fail.
- Test nào chưa chạy và lý do.
- Các vấn đề cần xử lý trước production.

### Giai đoạn E — Documentation

Sinh OpenAPI, API.md, `.env.example`, hướng dẫn deploy và các ví dụ fetch.

### Giai đoạn F — Kiểm tra cuối

Rà soát:

- Không có secret bị hardcode.
- Không có endpoint công khai cho phép sửa điểm.
- Không có đáp án bị lộ trước thời điểm.
- Không có đường truy cập trái phép vào lịch sử người khác.
- Không có thao tác cộng điểm không nguyên tử.
- Không phụ thuộc filesystem hoặc bộ nhớ của serverless function để lưu dữ liệu.
- Không có placeholder trong logic cốt lõi.
- Các route thực sự tương thích với Vercel.
- Cấu hình Realtime và RLS không mở dữ liệu ngoài ý muốn.

---

## 16. ĐỊNH DẠNG ĐẦU RA

Hãy trả về kết quả theo thứ tự:

1. Tổng quan kiến trúc và giả định.
2. Sơ đồ ERD.
3. Sơ đồ luồng xử lý trận đấu.
4. Cấu trúc thư mục.
5. Toàn bộ SQL migrations.
6. Các PostgreSQL functions/RPC cần thiết.
7. Toàn bộ mã nguồn backend theo từng file.
8. Cấu hình Vercel.
9. File `.env.example`.
10. File `openapi.yaml`.
11. File `API.md`.
12. Unit tests và integration tests.
13. Hướng dẫn deploy từ đầu đến cuối.
14. Checklist bảo mật production.
15. Kế hoạch benchmark và tối ưu chi phí.
16. Những giới hạn còn lại và hướng mở rộng.

Với mỗi file, ghi rõ đường dẫn tương đối và cung cấp toàn bộ nội dung, không chỉ một đoạn trích nếu file đó cần thiết để chạy.

Không bỏ qua các module cốt lõi rồi ghi “tự triển khai thêm”.

Không dùng pseudocode thay cho logic nghiệp vụ quan trọng.

Nếu nội dung quá dài, chia thành nhiều phần theo giai đoạn và giữ nguyên cấu trúc, tên file, schema, interface giữa các module. Không đổi tên API tùy tiện giữa các phần.

Nếu môi trường cho phép tạo file, hãy tạo source code thành một dự án hoàn chỉnh có thể đóng gói ZIP, thay vì chỉ hiển thị hàng chục đoạn code rời rạc. Sau đó kiểm tra cấu trúc file và hướng dẫn tôi tải về.

Không tuyên bố đã deploy lên Supabase hoặc Vercel, đã chạy test, hay đã kiểm tra production nếu chưa thực sự thực hiện các thao tác đó.

---

## 17. TIÊU CHÍ NGHIỆM THU

Backend chỉ được coi là hoàn thành khi đáp ứng các điều kiện sau:

- Frontend độc lập có thể gọi API bằng HTTP.
- Nhiều người chơi có thể tạo và tham gia phòng.
- Trạng thái trận được lưu bền vững trong database.
- Chủ phòng có quyền điều khiển hợp lệ.
- Người chơi có thể nộp đáp án và nhận kết quả.
- Server tự chấm điểm.
- Lịch sử lưu được từng câu trả lời.
- Leaderboard được tính từ dữ liệu chính thức.
- Người chơi không thể tự sửa điểm.
- Người chơi không thể xem lịch sử riêng tư của người khác.
- Câu trả lời đúng không bị lộ trước thời điểm.
- Request lặp không tạo kết quả trùng.
- Reconnect không làm mất trạng thái trận.
- Có migration, tài liệu API và hướng dẫn deploy.
- Có test cho logic nghiệp vụ và các trường hợp bảo mật quan trọng.
- Có kế hoạch kiểm thử tải và giới hạn của gói dịch vụ.
- Không có secret key trong frontend.
- Không có logic cốt lõi còn là placeholder.

Hãy bắt đầu bằng Giai đoạn A, sau đó tiếp tục triển khai lần lượt các giai đoạn còn lại. Ưu tiên tính đúng đắn, bảo mật và khả năng bảo trì trước khi tối ưu những phần chưa cần thiết.

Mục tiêu cuối cùng là một backend quiz trực tuyến thực sự hoạt động, có thể tích hợp với client HTML/CSS/JavaScript hiện tại của tôi mà không phải viết lại frontend.