# Huy ABO: tra cứu giá Amway

Trang web tĩnh, tối ưu cho mobile, dùng để **tra cứu giá sản phẩm Amway** và **tính tiền đơn hàng**.

**Link web:** https://huy-abo.vercel.app (Vercel tự deploy mỗi lần push lên `main`)

## Tính năng
- **Sản phẩm**: danh sách sản phẩm thật chia theo danh mục (Nutrilite, Artistry, Cá nhân, Gia dụng), card có hình, tên, giá bán lẻ. Tìm kiếm không cần gõ dấu, lọc theo danh mục.
- **Giá NPP** (chỉ bản VPS, khi đã đăng nhập): công tắc không chữ ở đầu tab Tài khoản, cạnh nút Đăng xuất. Bật thì tab Sản phẩm hiện thêm giá NPP và PV/BV; tab Đơn hàng tính theo giá NPP và hiện tổng PV/BV.
- **Đơn hàng**: gõ tìm rồi chạm để thêm sản phẩm, chỉnh số lượng, tự tính tổng. Có đơn mẫu (Combo F.Fit), hàng tặng, thông tin chuyển khoản ACB kèm QR. Bill (ảnh) có QR và đủ thông tin chuyển khoản: nút **Lưu bill** tải ảnh về máy, **Gửi bill** mở bảng chia sẻ (Zalo, Messenger...).
- **Liên kết**: các link hữu ích chia nhóm (Sản phẩm, Kinh doanh, Bài nghe).

## Tài khoản (Supabase)
- **Tự đăng ký** bằng SĐT + mật khẩu, chờ quản trị viên duyệt. Khách chưa đăng nhập chỉ xem giá bán lẻ.
- **Tài khoản nhận tiền riêng** cho từng người (VietQR tự điền số tiền) hoặc tải ảnh QR từ app ngân hàng.
- **Lưu đơn** kèm tên/SĐT khách, xem lại, mở lại, xoá trong tab Tài khoản. Mỗi người chỉ thấy đơn của mình.
- **Quản trị**: duyệt, khoá, đặt lại mật khẩu, xoá tài khoản.

Cài đặt: [SUPABASE.md](SUPABASE.md). Bản VPS cũ (`server/`, [DEPLOY.md](DEPLOY.md)) không còn được dùng.

## Chạy thử
Chỉ cần mở `index.html` bằng trình duyệt. Hoặc chạy server tĩnh:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

## Cập nhật dữ liệu
- **Sản phẩm**: sửa `data.js` (tên, mã, giá bán lẻ, ảnh, link). Đơn mẫu cũng nằm trong file này (`TEMPLATES`). Giá NPP, PV, BV nằm trong bảng `product_prices` trên Supabase.
- **Liên kết**: sửa `links.js`.
- Giá nhập dạng số, không dấu chấm/phẩy. Ví dụ `1041000`.

## Cấu trúc
| File | Vai trò |
|------|---------|
| `index.html` | Khung giao diện, các tab |
| `styles.css` | Giao diện, mobile-first |
| `data.js` | Dữ liệu sản phẩm và đơn mẫu |
| `links.js` | Dữ liệu liên kết |
| `app.js` | Logic tìm kiếm, tính tiền, thanh toán, xuất bill |
| `account.js` | Đăng ký, đăng nhập, tài khoản, đơn đã lưu, quản trị (Supabase) |
| `config.js` | Địa chỉ và anon key Supabase |
| `api/admin.js` | Hàm Vercel: đặt lại mật khẩu, xoá tài khoản |
| `supabase/schema.sql` | Bảng và phân quyền trên Supabase |
| `assets/qr-acb.jpg` | Mã QR ACB mặc định (khi chưa đăng nhập) |
| `assets/vietqr.js`, `assets/qrcode.js` | Tạo mã VietQR |
| `server/` | Backend VPS cũ (không còn dùng) |
| `Dockerfile`, `docker-compose.yml`, `Caddyfile` | Chạy trên VPS |
| `vercel.json`, `.vercelignore` | Cấu hình cho Vercel |
