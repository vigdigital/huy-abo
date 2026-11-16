# Cài đặt lên VPS

Bản chạy trên VPS có thêm **đăng nhập**, **tài khoản nhận tiền riêng của từng người** (QR VietQR tự điền số tiền) và **trang quản trị** để cấp tài khoản. Bản trên Vercel vẫn chạy song song như cũ (không có đăng nhập).

Toàn bộ chạy trong Docker: một container ứng dụng (Node.js + SQLite) và một container Caddy lo HTTPS.

## 1. Chuẩn bị

- VPS Linux có **Docker** và **Docker Compose**. Kiểm tra: `docker --version && docker compose version`.
  Chưa có thì cài theo https://docs.docker.com/engine/install/
- Một **tên miền** (ví dụ `abo.tenmien.vn`) đã trỏ bản ghi **A** về IP của VPS.
- Cổng **80** và **443** của VPS mở ra Internet (tường lửa của nhà cung cấp VPS và `ufw` nếu có).

## 2. Lấy code

```bash
git clone https://github.com/vigdigital/huy-abo.git
cd huy-abo
```

Nếu repo để riêng tư, cần tạo deploy key chỉ đọc (hỏi lại để được hướng dẫn).

## 3. Cấu hình

```bash
cp .env.example .env
nano .env        # sửa DOMAIN thành tên miền của bạn
```

- VPS **chưa có** web server nào dùng cổng 80/443: giữ nguyên dòng `COMPOSE_PROFILES=caddy`.
- VPS **đã có** Nginx/Apache: xoá dòng đó và làm theo mục **Đã có Nginx** bên dưới.

## 4. Chạy

```bash
docker compose up -d --build
docker compose ps        # app phải ở trạng thái "healthy" sau khoảng 30 giây
```

Caddy tự xin chứng chỉ HTTPS ở lần chạy đầu (mất vài chục giây). Nếu lỗi, xem `docker compose logs caddy`: thường do tên miền chưa trỏ đúng IP hoặc cổng 80/443 bị chặn.

## 5. Tạo tài khoản admin đầu tiên

```bash
docker compose exec app npm --prefix server run create-admin --silent
```

Nhập SĐT, tên và mật khẩu (mật khẩu không hiện khi gõ). Sau đó mở `https://<tên miền>`, vào tab **Tài khoản** để đăng nhập.

Quên mật khẩu admin: chạy lại lệnh trên với cùng SĐT để đặt mật khẩu mới.

## 6. Kiểm tra mã QR trước khi dùng thật

Trong tab Tài khoản, nhập thông tin nhận tiền, tạo một đơn nhỏ rồi **dùng app ngân hàng quét thử** mã QR ở trang Đơn hàng: kiểm tra đúng tên người nhận, số tài khoản và số tiền. Làm việc này với từng ngân hàng mà các nhà phân phối dùng.

## Cập nhật khi có bản mới

Từ máy tính có SSH vào VPS (trong thư mục repo, sau khi đã push lên `main`):

```bash
scripts/deploy.sh <ssh-host>      # ví dụ: scripts/deploy.sh root@1.2.3.4
```

Hoặc làm tay trên VPS:

```bash
cd huy-abo
git pull
docker compose up -d --build
```

Dữ liệu tài khoản không mất khi cập nhật (nằm trong volume `appdata`).

## Sao lưu

Ứng dụng tự tạo **một bản sao lưu mỗi ngày** trong VPS, giữ 14 bản gần nhất. Nên định kỳ chép ra ngoài VPS:

```bash
docker compose cp app:/data/backups ./backups
```

Khôi phục từ một bản sao lưu (thay `app-YYYY-MM-DD.db` bằng tên file muốn dùng, file nằm trong thư mục `./backups`):

```bash
docker compose stop app
docker compose run --rm --no-deps -v ./backups:/restore app \
  sh -c 'cp /restore/app-YYYY-MM-DD.db /data/app.db && rm -f /data/app.db-wal /data/app.db-shm'
docker compose start app
```

## Đã có Nginx

Xoá dòng `COMPOSE_PROFILES=caddy` trong `.env`, chạy `docker compose up -d --build`, rồi thêm vào cấu hình Nginx:

```nginx
server {
    server_name abo.tenmien.vn;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Sau đó bật HTTPS: `sudo certbot --nginx -d abo.tenmien.vn` và `sudo nginx -s reload`.

## Lệnh hay dùng

| Việc | Lệnh |
|---|---|
| Xem log | `docker compose logs -f app` |
| Khởi động lại | `docker compose restart` |
| Dừng | `docker compose down` (không xoá dữ liệu) |
