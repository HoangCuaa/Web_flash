# 🚀 HƯỚNG DẪN DEPLOY TOÀN DIỆN LÊN VERCEL & SUPABASE

Tài liệu này hướng dẫn chi tiết từng bước triển khai ứng dụng Quiz Online từ môi trường Local lên môi trường Production thực tế với **Supabase (PostgreSQL Database)** và **Vercel (Frontend & Serverless Functions)**.

---

## 🏗️ 1. Kiến Trúc Triển Khai (Production Architecture)

```
[Người dùng Trình duyệt] 
       │
       ▼
[Vercel Global Edge Network]
  ├── Frontend: index.html, app.js, admin.html, admin.js (Static CDN cực nhanh)
  └── Backend API: /api/v1/* (Node.js Serverless Functions)
       │
       ▼ (Chấm điểm Zero-Trust, bảo mật Service Role)
[Supabase Database (PostgreSQL 15+)]
  ├── 12 Bảng chuẩn hóa + Indexes
  ├── 4 Stored Procedures nguyên tử (Atomicity & Concurrency safe)
  └── Row Level Security (RLS) bảo vệ dữ liệu người chơi
```

---

## 🗄️ BƯỚC 1: Khởi Tạo Database Trên Supabase

1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập (hoặc tạo tài khoản miễn phí).
2. Bấm **"New project"**:
   - **Name:** `quiz-online-platform` (hoặc tên tùy ý)
   - **Database Password:** Đặt mật khẩu an toàn và lưu lại
   - **Region:** Chọn **Singapore (`ap-southeast-1`)** để người dùng Việt Nam có độ trễ thấp nhất (< 40ms)
   - **Pricing Plan:** Free
3. Bấm **"Create new project"** và chờ khoảng 1-2 phút để Supabase tạo database.

### 📝 Chạy Các File Migration SQL
Vào menu bên trái chọn biểu tượng **SQL Editor** (`>_`), bấm **"New query"** và copy/paste lần lượt 4 file SQL trong thư mục `backend/db/migrations/`:

1. **`001_initial_schema.sql`:** Tạo 12 bảng chuẩn hóa, indexes, constraints ➔ Bấm **Run**.
2. **`002_functions_and_rpcs.sql`:** Cài đặt 4 hàm nguyên tử xử lý phòng & chấm điểm (`create_room_with_snapshot`, `join_room_atomic`, `submit_answer_atomic`, `advance_room_question_atomic`) ➔ Bấm **Run**.
3. **`003_rls_policies.sql`:** Kích hoạt Row-Level Security ➔ Bấm **Run**.
4. **`004_seed_data.sql`:** Nạp bộ câu hỏi và đề thi mẫu chuẩn ➔ Bấm **Run**.

### 🔑 Lấy Thông Tin Kết Nối (API Keys)
Vào **Project Settings** (biểu tượng bánh răng ở góc dưới bên trái) ➔ **API**:
- **Project URL:** Dạng `https://abcdefghijklmnop.supabase.co`
- **anon public:** Khóa công khai `eyJh...`
- **service_role secret:** Khóa bí mật (bấm *Reveal* để copy) `eyJh...`

---

## ☁️ BƯỚC 2: Deploy Lên Vercel

### Cách 1: Deploy Bằng GitHub (Khuyên Dùng — Tự Động Cập Nhật Khi Push Code)

1. Đẩy toàn bộ mã nguồn thư mục `Web_flash` lên một repository mới trên GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete quiz platform ready for production"
   git branch -M main
   git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repo>.git
   git push -u origin main
   ```
2. Truy cập [https://vercel.com](https://vercel.com) ➔ Bấm **"Add New..."** ➔ **"Project"**.
3. Chọn repository vừa push ➔ Bấm **"Import"**.
4. Tại màn hình **Configure Project**:
   - **Framework Preset:** Chọn `Other`
   - **Root Directory:** Để mặc định `./`
   - Mở rộng mục **Environment Variables** và điền 5 biến môi trường:

| Tên Biến | Giá Trị Mẫu | Mô Tả |
|---|---|---|
| `SUPABASE_URL` | `https://xyz.supabase.co` | Lấy từ Supabase API Settings |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Lấy từ Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | Lấy từ Supabase service_role key |
| `ADMIN_SECRET` | `MatKhauAdminCuaBan_2026!` | Mật khẩu dùng để đăng nhập `/admin.html` |
| `NODE_ENV` | `production` | Bật chế độ production bảo mật |

5. Bấm **"Deploy"**. Chờ khoảng 30-45 giây, Vercel sẽ cấp cho bạn tên miền miễn phí dạng `https://ten-du-an.vercel.app`!

---

### Cách 2: Deploy Trực Tiếp Bằng Vercel CLI

Nếu bạn không muốn dùng GitHub:
1. Cài đặt Vercel CLI (nếu chưa có):
   ```bash
   npm install -g vercel
   ```
2. Tại thư mục gốc `Web_flash`, chạy lệnh:
   ```bash
   vercel
   ```
   Làm theo hướng dẫn trên màn hình để liên kết tài khoản Vercel.
3. Thêm các biến môi trường qua lệnh:
   ```bash
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add ADMIN_SECRET production
   vercel env add NODE_ENV production
   ```
4. Deploy lên môi trường Production:
   ```bash
   vercel --prod
   ```

---

## 🎯 BƯỚC 3: Nghiệm Thu Sau Khi Deploy (Checklist)

1. **Giao diện Người dùng (`/`):**
   - Truy cập URL Vercel được cấp.
   - Kiểm tra tên hiển thị tự động sinh (vd `Player_1234`).
   - Bấm **"Làm Bài"** ➔ Hoàn thành bài thi và kiểm tra:
     - Điểm số và thời gian làm (`⏱️ mm:ss`) hiển thị đúng.
     - Bấm **"Xem Bảng Xếp Hạng"** ➔ Tên của bạn xuất hiện với huy hiệu `[BẠN]`.
2. **Chế độ Phòng Thi Đấu Nhiều Người:**
   - Mở link trên 2 thiết bị khác nhau (hoặc 1 tab thường + 1 tab ẩn danh).
   - Thiết bị 1 tạo phòng ➔ Gửi mã phòng cho Thiết bị 2.
   - Thiết bị 2 nhập mã và bấm **Tham Gia** ➔ Danh sách người chơi trên cả 2 máy lập tức hiển thị đủ 2 người.
   - Thiết bị 1 bấm **"▶ Bắt Đầu Trận Đấu"** ➔ Cả 2 máy cùng nhảy vào giao diện câu hỏi đồng bộ.
3. **Trang Quản Trị Admin (`/admin.html`):**
   - Truy cập `https://ten-du-an.vercel.app/admin.html`.
   - Nhập `ADMIN_SECRET` đã cấu hình ở Bước 2.
   - Xem số liệu thống kê (Tổng người chơi, tổng lượt thi, tỷ lệ hoàn thành).
   - Thử tạo mới bộ câu hỏi hoặc xem đáp án chính thức.

---

## 🔒 Ghi Chú Bảo Mật Production
- **Không bao giờ lộ `SUPABASE_SERVICE_ROLE_KEY` hay `ADMIN_SECRET` vào mã nguồn client:** Hai khóa này chỉ được lưu trong Vercel Environment Variables và chỉ serverless functions mới có quyền đọc.
- **RLS (Row Level Security):** Đã được cấu hình tự động bảo vệ dữ liệu trong `003_rls_policies.sql`, ngăn chặn tuyệt đối việc người chơi sửa điểm hoặc xem trộm đáp án đúng trước giờ nộp.
