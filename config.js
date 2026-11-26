/* ============================================================
   KẾT NỐI SUPABASE
   - Hai giá trị này là loại CÔNG KHAI (anon key), để trong web được.
     Dữ liệu được bảo vệ bằng phân quyền trong database (supabase/schema.sql).
   - KHÔNG BAO GIỜ dán "service_role key" vào đây. Key đó chỉ đặt trong
     Vercel > Settings > Environment Variables (SUPABASE_SERVICE_ROLE_KEY).
   - Để trống thì web chạy như bản tĩnh: chỉ giá bán lẻ, không đăng nhập.
   ============================================================ */
const SUPABASE_URL = "https://ahuajhdskoxtkpeyudka.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFodWFqaGRza294dGtwZXl1ZGthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2NzAzMTUsImV4cCI6MjExMTI0NjMxNX0.N2JUPM6xE-jYc_ZvRbu-79BjvRDYFIn8NrZ41YOV8Q4";
