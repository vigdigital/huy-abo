# huy-abo — hướng dẫn cho Claude

Công cụ tra cứu giá sản phẩm Amway và tính tiền đơn hàng, tối ưu cho điện thoại. Chủ dự án nói tiếng Việt: trả lời bằng tiếng Việt.

## Hai nơi chạy, một bộ code

| | Vercel | VPS |
|---|---|---|
| Địa chỉ | https://huy-abo.vercel.app | tên miền riêng (xem `.env` trên VPS) |
| Backend | không có | `server/` (Node.js + SQLite) trong Docker, Caddy lo HTTPS |
| Đăng nhập | không | có |
| Cập nhật | tự deploy khi push lên `main` | `scripts/deploy.sh <ssh-host>` sau khi push |

`account.js` gọi `/api/health` khi tải trang. Không có backend (Vercel) thì web chạy như bản tĩnh: không có giá NPP/PV/BV, QR ACB mặc định. Mọi thay đổi giao diện phải chạy đúng ở **cả hai** chế độ.

## Cấu trúc

- `index.html`, `styles.css`, `app.js` (sản phẩm, đơn hàng, thanh toán, xuất bill), `account.js` (đăng nhập, tài khoản, quản trị).
- `data.js`: `CATEGORIES`, `PRODUCTS`, `TEMPLATES` (đơn mẫu). `links.js`: `LINK_GROUPS`, `LINKS`.
- `assets/vietqr.js`: tạo chuỗi VietQR + danh sách mã BIN ngân hàng. `assets/qrcode.js`: thư viện vẽ QR (MIT, không sửa).
- `server/`: `server.js` (API), `db.js` (schema, sao lưu hằng ngày), `auth.js` (scrypt, cookie phiên), `create-admin.js`.
- `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `.env.example`, `DEPLOY.md`. `.vercelignore` giữ code server khỏi Vercel.

## Sửa dữ liệu

- Sản phẩm mới: thêm vào `PRODUCTS` theo đúng mẫu các mục có sẵn (`category, name, code, price, priceNpp, pv, bv, img, link`). Giá là số nguyên VNĐ không dấu chấm. Link sản phẩm: `https://www.amway.com.vn/vn/p/<mã>`. Không có PV/BV thì bỏ hai trường đó.
- Liên kết mới: thêm vào `LINKS` với `group` là id trong `LINK_GROUPS`.

## Quy tắc bắt buộc

- **Tăng version cache** khi sửa bất kỳ file HTML/CSS/JS nào: đổi mọi `?v=N` trong `index.html` thành `N+1`, và cả `DEFAULT_PAYEE.img` trong `app.js`. Không làm thì điện thoại người dùng giữ bản cũ.
- **Phát hành** = commit + push lên `main` (Vercel tự cập nhật), rồi chạy `scripts/deploy.sh` để cập nhật VPS. Hỏi chủ dự án host SSH nếu chưa biết; không đoán.
- Không commit `.env`, file `.db`, mật khẩu, key. Không tự tạo hay đặt mật khẩu tài khoản: admin tự chạy `docker compose exec app npm --prefix server run create-admin --silent`.
- Không đổi schema bảng `users`/`sessions` mà không có bước chuyển dữ liệu cũ; dữ liệu thật nằm trong volume `appdata` trên VPS. Trước khi đụng tới dữ liệu trên VPS, nhắc chủ dự án chép bản sao lưu ra ngoài (xem `DEPLOY.md`).
- Giá NPP, PV/BV chỉ hiện khi **đã đăng nhập**. Công tắc nằm trong tab Tài khoản và cố ý **không có chữ** (khách đứng xem không biết mà bấm); không đưa lại lên header, không ghi chữ "NPP" ở chỗ khách thấy được (kể cả trang đăng nhập).
- Người đã đăng nhập mà chưa nhập ngân hàng thì **không** được hiện tài khoản mặc định của chủ dự án (tránh khách chuyển nhầm tiền).
- Sửa phần VietQR hay danh sách BIN: kiểm tra bằng cách giải mã lại QR, và nhắc chủ dự án quét thử bằng app ngân hàng.

## Chạy thử trên máy

```bash
# Chế độ tĩnh (như Vercel)
python3 -m http.server 8000

# Chế độ có backend (như VPS), dữ liệu thử để ngoài repo
cd server && npm install
DATA_DIR=/tmp/huy-abo-test PUBLIC_DIR=.. PORT=3000 npm start
```

Chế độ backend có `PUBLIC_DIR=..` sẽ phục vụ cả thư mục repo; bản Docker chỉ chép các file web nên không lộ code server.
