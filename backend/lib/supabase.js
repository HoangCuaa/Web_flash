// backend/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { createMockSupabaseClient } from './local-mock-db.js';

let supabaseInstance = null;
let hasLoggedMockNotice = false;

function cleanSupabaseUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  // Tự động loại bỏ /rest/v1 hoặc dấu gạch chéo cuối nếu người dùng copy từ Swagger/REST API docs
  clean = clean.replace(/\/rest\/v1\/?$/i, '');
  clean = clean.replace(/\/+$/, '');
  return clean;
}

function isValidRealSupabaseUrl(url) {
  const clean = cleanSupabaseUrl(url);
  if (!clean) return false;
  // Kiểm tra nếu còn là placeholder hoặc chứa dấu ngoặc nhọn <...>
  if (clean.includes('<') || clean.includes('>') || clean.includes('project-id') || clean.includes('your-project')) {
    return false;
  }
  try {
    const parsed = new URL(clean);
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname.endsWith('supabase.co');
  } catch {
    return false;
  }
}

export function getSupabase() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const rawUrl = process.env.SUPABASE_URL || '';
  const supabaseUrl = cleanSupabaseUrl(rawUrl);
  const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  // Nếu đã cấu hình Supabase URL và Secret Key thật
  if (isValidRealSupabaseUrl(supabaseUrl) && supabaseServiceRoleKey && !supabaseServiceRoleKey.includes('<')) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      console.log(`[SUPABASE] Đã kết nối thành công tới Database Supabase thật: ${supabaseUrl}`);
      return supabaseInstance;
    } catch (err) {
      console.warn('[SUPABASE] Lỗi khởi tạo client thật, chuyển sang Local Mock DB:', err.message);
    }
  }

  // Nếu chưa có tài khoản Supabase hoặc đang để giá trị mẫu, tự động bật Local Mock DB
  if (!hasLoggedMockNotice) {
    console.log('\n[CHẾ ĐỘ LOCAL TEST] Chưa có thông tin Supabase thật trong .env.');
    console.log('👉 Hệ thống đang tự động kích hoạt Local In-Memory Database để bạn test giao diện và Admin ngay lập tức!');
    console.log('👉 Khi nào tạo Supabase xong, hãy thay SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong .env để chuyển sang database thật.\n');
    hasLoggedMockNotice = true;
  }

  supabaseInstance = createMockSupabaseClient();
  return supabaseInstance;
}
