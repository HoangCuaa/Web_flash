# TÀI LIỆU TÍCH HỢP REST API - MULTIPLAYER QUIZ PLATFORM

Tài liệu này cung cấp hướng dẫn đầy đủ để lập trình viên Frontend tích hợp với Backend Quiz Online thông qua chuẩn REST API `/api/v1` và Supabase Realtime.

---

## 1. NGUYÊN TẮC CHUNG

1. **Base URL**: `/api/v1` (Ví dụ trên production: `https://your-domain.vercel.app/api/v1`).
2. **Định dạng dữ liệu**: Tất cả Request Body và Response đều sử dụng JSON UTF-8.
3. **Xác thực (Authentication)**:
   - Dùng Header: `Authorization: Bearer <GUEST_TOKEN>` hoặc `x-guest-token: <GUEST_TOKEN>`.
   - Token được sinh khi gọi API `POST /api/v1/guests`. Client cần lưu giữ token này trong `localStorage` hoặc `sessionStorage`.
4. **Cấu trúc Response Thành công**:
   ```json
   {
     "success": true,
     "data": { ... },
     "meta": {
       "timestamp": "2026-10-28T12:00:00.000Z"
     }
   }
   ```
5. **Cấu trúc Response Lỗi**:
   ```json
   {
     "success": false,
     "error": {
       "code": "ROOM_NOT_FOUND",
       "message": "Phòng không tồn tại",
       "details": {}
     },
     "requestId": "550e8400-e29b-41d4-a716-446655440000"
   }
   ```

---

## 2. BẢNG MÃ LỖI CHUẨN (ERROR CODES)

| Error Code | HTTP Status | Ý nghĩa |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Dữ liệu gửi lên không đúng định dạng hoặc thiếu trường bắt buộc |
| `UNAUTHORIZED` | 401 | Thiếu token hoặc token không hợp lệ |
| `FORBIDDEN` | 403 | Không có quyền (VD: người chơi thường cố bắt đầu phòng) |
| `NOT_FOUND` | 404 | Không tìm thấy phòng, câu hỏi, hoặc quiz |
| `ROOM_ALREADY_STARTED` | 409 | Phòng đã bắt đầu trận, không thể tham gia |
| `ROOM_FULL` | 409 | Phòng đã đạt giới hạn người chơi tối đa |
| `NICKNAME_TAKEN` | 409 | Nickname đã bị trùng trong phòng này |
| `DUPLICATE_SUBMISSION` | 409 | Đã nộp đáp án cho câu hỏi này trước đó |
| `DEADLINE_EXCEEDED` | 410 | Đã hết thời gian nộp bài cho câu hỏi hiện tại |
| `RATE_LIMIT_EXCEEDED` | 429 | Gửi quá nhiều request trong thời gian ngắn |
| `INTERNAL_SERVER_ERROR`| 500 | Lỗi máy chủ nội bộ |

---

## 3. DANH SÁCH ENDPOINTS CHI TIẾT

### 3.1. Người chơi (Guest / Player)
- `POST /api/v1/guests`: Đăng ký người chơi ẩn danh. Body: `{ "nickname": "Tên_Người_Chơi" }`.
- `POST /api/v1/guests/recover`: Khôi phục token. Body: `{ "recoveryCode": "MÃ_KHÔI_PHỤC" }`.
- `GET /api/v1/players/me`: Lấy thông tin cá nhân của token hiện tại.
- `GET /api/v1/players/me/history?page=1&limit=20`: Lấy lịch sử các trận đấu đã chơi.
- `GET /api/v1/players/me/history/:attemptId`: Xem chi tiết điểm, các câu hỏi và đáp án kèm giải thích của một trận đã hoàn thành.

### 3.2. Quản lý phòng (Rooms)
- `POST /api/v1/rooms`: Tạo phòng mới. Body: `{ "quizId": "UUID", "maxPlayers": 20, "timePerQuestion": 20 }`.
- `GET /api/v1/rooms/:roomCode`: Xem thông tin phòng công khai.
- `POST /api/v1/rooms/:roomCode/join`: Tham gia phòng. Body: `{ "nickname": "Tên" }`.
- `POST /api/v1/rooms/:roomCode/ready`: Sẵn sàng/Hủy sẵn sàng. Body: `{ "isReady": true }`.
- `POST /api/v1/rooms/:roomCode/leave`: Rời phòng.
- `POST /api/v1/rooms/:roomCode/start`: (Chủ phòng) Bắt đầu trận đấu.
- `POST /api/v1/rooms/:roomCode/cancel`: (Chủ phòng) Hủy phòng.
- `POST /api/v1/rooms/:roomCode/next-question`: (Chủ phòng) Chuyển câu hỏi kế tiếp.
- `GET /api/v1/rooms/:roomCode/players`: Lấy danh sách thành viên trong phòng.
- `GET /api/v1/rooms/:roomCode/state`: Lấy trạng thái phòng phục vụ Reconnect.

### 3.3. Gameplay & Câu hỏi
- `GET /api/v1/rooms/:roomCode/current-question`: Lấy câu hỏi đang diễn ra.
- `POST /api/v1/rooms/:roomCode/answers`: Nộp đáp án. Body: `{ "questionId": "UUID", "selectedOptionId": "UUID", "clientTimeTakenMs": 3200 }`. Hỗ trợ Header `Idempotency-Key`.
- `POST /api/v1/rooms/:roomCode/skip`: Bỏ qua câu hỏi hiện tại. Body: `{ "questionId": "UUID" }`.
- `GET /api/v1/rooms/:roomCode/results`: Xem bảng tổng kết chung cuộc sau khi trận đấu kết thúc.

### 3.4. Bảng xếp hạng (Leaderboards)
- `GET /api/v1/rooms/:roomCode/leaderboard`: Bảng xếp hạng trực tiếp trong phòng.
- `GET /api/v1/quizzes/:quizId/leaderboard`: BXH theo bộ quiz.
- `GET /api/v1/leaderboard/global`: BXH toàn hệ thống.
- `GET /api/v1/leaderboard/daily`: BXH trong ngày.

---

## 4. CODE MẪU JAVASCRIPT `fetch()` CHO FRONTEND

Client có thể tạo file `api-client.js` độc lập để sử dụng các hàm sau:

```javascript
const API_BASE = '/api/v1';

// Lấy token lưu trữ
function getAuthHeaders() {
  const token = localStorage.getItem('quiz_guest_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 1. Tạo khách ẩn danh
export async function createGuest(nickname) {
  const res = await fetch(`${API_BASE}/guests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname }),
  });
  const data = await res.json();
  if (data.success) {
    localStorage.setItem('quiz_guest_token', data.data.token);
    localStorage.setItem('quiz_recovery_code', data.data.recoveryCode);
    return data.data;
  }
  throw new Error(data.error?.message || 'Không thể tạo tài khoản khách');
}

// 2. Tạo phòng quiz
export async function createRoom(quizId, maxPlayers = 20, timePerQuestion = 20) {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ quizId, maxPlayers, timePerQuestion }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message);
  return data.data; // Chứa roomCode
}

// 3. Tham gia phòng
export async function joinRoom(roomCode, nickname) {
  const res = await fetch(`${API_BASE}/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ nickname }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message);
  return data.data;
}

// 4. Bật sẵn sàng (Ready)
export async function toggleReady(roomCode, isReady = true) {
  const res = await fetch(`${API_BASE}/rooms/${roomCode}/ready`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ isReady }),
  });
  return res.json();
}

// 5. Chủ phòng bắt đầu trận đấu
export async function startRoom(roomCode) {
  const res = await fetch(`${API_BASE}/rooms/${roomCode}/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message);
  return data.data;
}

// 6. Lấy câu hỏi hiện tại
export async function getCurrentQuestion(roomCode) {
  const res = await fetch(`${API_BASE}/rooms/${roomCode}/current-question`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message);
  return data.data;
}

// 7. Nộp câu trả lời (Có Idempotency Key)
export async function submitAnswer(roomCode, questionId, selectedOptionId, clientTimeTakenMs) {
  const idempotencyKey = `${roomCode}_${questionId}_${localStorage.getItem('quiz_guest_token')}`;
  
  const headers = getAuthHeaders();
  headers['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`${API_BASE}/rooms/${roomCode}/answers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      questionId,
      selectedOptionId,
      clientTimeTakenMs,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error?.message);
  return data.data;
}

// 8. Lấy trạng thái phòng (Dùng cho Polling Fallback hoặc Reconnect)
export async function getRoomState(roomCode) {
  const res = await fetch(`${API_BASE}/rooms/${roomCode}/state`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return data.data;
}

// 9. Lấy bảng xếp hạng phòng
export async function getRoomLeaderboard(roomCode) {
  const res = await fetch(`${API_BASE}/rooms/${roomCode}/leaderboard`, {
    method: 'GET',
  });
  const data = await res.json();
  return data.data;
}

// 10. Lấy kết quả cuối trận
export async function getRoomResults(roomCode) {
  const res = await fetch(`${API_BASE}/rooms/${roomCode}/results`, {
    method: 'GET',
  });
  const data = await res.json();
  return data.data;
}

// 11. Xem lịch sử thi của bản thân
export async function getMyHistory(page = 1, limit = 20) {
  const res = await fetch(`${API_BASE}/players/me/history?page=${page}&limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return data.data;
}

// 12. Retry với Exponential Backoff khi gặp sự cố mạng
export async function fetchWithRetry(url, options = {}, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok && response.status >= 500) {
        throw new Error(`Server error HTTP ${response.status}`);
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, attempt - 1)));
    }
  }
}
```

---

## 5. HƯỚNG DẪN TÍCH HỢP SUPABASE REALTIME

Để cập nhật thời gian thực mà không cần liên tục gọi polling:
1. Thêm thư viện Supabase JS vào `index.html`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   ```
2. Khởi tạo với Anon Key (chỉ quyền đọc công khai):
   ```javascript
   const supabase = window.supabase.createClient('https://<PROJECT-ID>.supabase.co', '<SUPABASE_ANON_KEY>');
   
   // Đăng ký nghe sự kiện cập nhật của phòng
   const channel = supabase.channel(`room_${roomCode}`)
     .on('postgres_changes', {
       event: 'UPDATE',
       schema: 'public',
       table: 'rooms',
       filter: `code=eq.${roomCode}`
     }, (payload) => {
       console.log('Phòng thay đổi trạng thái:', payload.new);
       if (payload.new.status === 'in_progress') {
         // Tải câu hỏi mới
         loadCurrentQuestion();
       }
     })
     .subscribe();
   ```
3. Luôn giữ hàm `getRoomState(roomCode)` làm fallback khi mất kết nối mạng hoặc reconnect.
