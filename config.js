/* ============================================================
   KẾT NỐI SUPABASE
   - Hai giá trị này là loại CÔNG KHAI (anon key), để trong web được.
     Dữ liệu được bảo vệ bằng phân quyền trong database (supabase/schema.sql).
   - KHÔNG BAO GIỜ dán "service_role key" vào đây. Key đó chỉ đặt trong
     Vercel > Settings > Environment Variables (SUPABASE_SERVICE_ROLE_KEY).
   - Để trống thì web chạy như bản tĩnh: chỉ giá bán lẻ, không đăng nhập.
   ============================================================ */
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";
