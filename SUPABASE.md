# Cài Supabase cho Huy ABO

Web chạy trên Vercel, dữ liệu (tài khoản, giá NPP, đơn hàng, ảnh QR) nằm trên Supabase.

## 1. Tạo dự án
- Supabase > New project, khu vực **Southeast Asia (Singapore)**, gói Free.

## 2. Tạo database
- Chạy `supabase/schema.sql` (SQL Editor, hoặc Claude chạy qua connector Supabase). Chạy lại nhiều lần không sao.
- Nạp giá NPP/PV/BV vào bảng `product_prices`. File giá **không nằm trong repo** (repo công khai); chủ dự án giữ bản riêng.

## 3. Cấu hình đăng nhập
- Authentication > Sign In / Providers > **Email**: bật Email, **tắt "Confirm email"**.
  Web dùng SĐT làm tên đăng nhập, quy ra email nội bộ `<sđt>@phone.huyabo.app`, không gửi thư.
- Mật khẩu tối thiểu 6 ký tự (mặc định của Supabase).

## 4. Nối web với Supabase
- `config.js`: điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` (Project Settings > API). Hai giá trị này công khai được.
- Vercel > Project > Settings > Environment Variables, thêm:
  - `SUPABASE_URL` (như trên)
  - `SUPABASE_SERVICE_ROLE_KEY` (**bí mật**, chỉ đặt ở đây, không đưa vào code)
  Dùng cho `api/admin.js` (đặt lại mật khẩu, xoá tài khoản). Thêm xong thì Redeploy.

## 5. Tài khoản admin đầu tiên
- Chủ dự án tự đăng ký trên web, rồi chạy trong SQL Editor:
  `update public.profiles set role = 'admin', status = 'active' where phone = '09xxxxxxxx';`

## Cách hoạt động
- Người mới tự đăng ký: trạng thái **Chờ duyệt**. Admin bấm **Duyệt** trong tab Tài khoản.
- Chỉ tài khoản đã duyệt mới tải được giá NPP/PV/BV và lưu đơn.
- Mỗi người chỉ thấy đơn và ảnh QR của chính mình (Row Level Security trong `schema.sql`). Admin cũng không xem được đơn của người khác.
- Khoá tài khoản có hiệu lực ngay: mọi truy vấn đều kiểm tra trạng thái.

## Lưu ý gói Free
- Dự án không có truy cập 7 ngày sẽ bị tạm dừng; vào Supabase bấm Restore.
- Không có sao lưu tự động: cần sao lưu riêng (chưa làm).
