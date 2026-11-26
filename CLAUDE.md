# huy-abo — hướng dẫn cho Claude

Công cụ tra cứu giá sản phẩm Amway và tính tiền đơn hàng, tối ưu cho điện thoại. Chủ dự án nói tiếng Việt: trả lời bằng tiếng Việt.

## Nơi chạy

- **Vercel** (https://huy-abo.vercel.app): web tĩnh + hàm `api/admin.js`. Tự deploy khi push lên `main`.
- **Supabase**: đăng nhập, hồ sơ, giá NPP/PV/BV, đơn hàng, ảnh QR. Cài đặt: `SUPABASE.md`, database: `supabase/schema.sql`.
- `config.js` để trống URL/key thì web chạy như bản tĩnh (chỉ giá bán lẻ, ẩn tab Tài khoản, QR ACB mặc định). Mọi thay đổi giao diện phải chạy đúng ở **cả hai** chế độ.
- Bản VPS cũ (`server/`, Docker, `DEPLOY.md`, `scripts/deploy.sh`) **không còn được web dùng** từ khi chuyển sang Supabase (26/11/2026). Chờ chủ dự án xác nhận rồi mới xoá.

## Cấu trúc

- `index.html`, `styles.css`, `app.js` (sản phẩm, đơn hàng, thanh toán, xuất bill), `account.js` (đăng ký, đăng nhập, tài khoản, đơn đã lưu, quản trị; gọi Supabase).
- `data.js`: `CATEGORIES`, `PRODUCTS` (chỉ giá bán lẻ), `TEMPLATES` (đơn mẫu). `links.js`: `LINK_GROUPS`, `LINKS`.
- `assets/supabase.js`: supabase-js 2.45.4 bản UMD (MIT, chép nguyên, không sửa). `assets/vietqr.js`: VietQR + mã BIN. `assets/qrcode.js`: vẽ QR (MIT, không sửa).
- Đăng nhập bằng SĐT: quy ra email nội bộ `<sđt>@phone.huyabo.app` (Supabase phải tắt "Confirm email").
- Ảnh QR người dùng: Storage bucket `qr`, đường dẫn `<user_id>/qr`, tải về dạng blob để vẽ được vào bill.

## Sửa dữ liệu

- Sản phẩm mới: thêm vào `PRODUCTS` theo mẫu có sẵn (`category, name, code, price, img, link`). Giá là số nguyên VNĐ không dấu chấm. Link sản phẩm: `https://www.amway.com.vn/vn/p/<mã>`.
- Giá NPP/PV/BV **không bao giờ** đưa vào repo (repo công khai): upsert vào bảng `product_prices` trên Supabase theo `code`.
- Tab **Thư viện** (trước là "Liên kết"): mục mới thêm vào `LINKS` trong `links.js`, `group` là id trong `LINK_GROUPS` (nhóm phân loại hiện thành nút lọc).

## Quy tắc bắt buộc

- **Tăng version cache** khi sửa bất kỳ file HTML/CSS/JS nào: đổi mọi `?v=N` trong `index.html` thành `N+1`, và cả `DEFAULT_PAYEE.img` trong `app.js`. Không làm thì điện thoại người dùng giữ bản cũ.
- **Phát hành** = commit + push lên `main` (Vercel tự cập nhật).
- Không commit `.env`, mật khẩu, `service_role` key, dữ liệu khách. Chỉ anon key được nằm trong `config.js`. Không tự tạo hay đặt mật khẩu tài khoản: người dùng tự đăng ký, admin duyệt.
- Đổi schema: sửa `supabase/schema.sql` sao cho chạy lại được (if not exists / or replace), không xoá cột đang có dữ liệu mà không có bước chuyển. Dữ liệu thật nằm trên Supabase; trước khi chạy lệnh sửa/xoá dữ liệu, hỏi chủ dự án.
- Mọi bảng mới phải bật RLS. Đơn hàng: mỗi người chỉ thấy của mình.
- Giá NPP, PV/BV chỉ hiện khi **đã đăng nhập**. Công tắc nằm trong tab Tài khoản và cố ý **không có chữ** (khách đứng xem không biết mà bấm); không đưa lại lên header, không ghi chữ "NPP" ở chỗ khách thấy được (kể cả trang đăng nhập).
- Người đã đăng nhập mà chưa nhập ngân hàng thì **không** được hiện tài khoản mặc định của chủ dự án (tránh khách chuyển nhầm tiền).
- Sửa phần VietQR hay danh sách BIN: kiểm tra bằng cách giải mã lại QR, và nhắc chủ dự án quét thử bằng app ngân hàng.

## Chạy thử trên máy

```bash
# Chế độ tĩnh (như Vercel)
python3 -m http.server 8000
```

Thử phần đăng nhập: dùng bản preview Vercel của nhánh (đã nối Supabase thật), hoặc giả lập `supabase` trong Playwright. Kiểm tra RLS bằng Postgres cục bộ với schema `auth`/`storage` giả.
