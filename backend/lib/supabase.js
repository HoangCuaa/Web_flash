// backend/lib/supabase.js
import { createClient } from '@supabase/supabase-js';
import { createMockSupabaseClient } from './local-mock-db.js';

let supabaseInstance = null;
let hasLoggedMockNotice = false;

function isValidRealSupabaseUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim();
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

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  // Nếu đã cấu hình Supabase URL và Secret Key thật
  if (isValidRealSupabaseUrl(supabaseUrl) && supabaseServiceRoleKey && !supabaseServiceRoleKey.includes('<')) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
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
