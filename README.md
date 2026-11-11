# Tra cứu giá Amway

Trang web tĩnh, tối ưu cho mobile, dùng để **tra cứu giá sản phẩm Amway** và **tính tiền đơn hàng**.

**Link web:** https://huy-abo.vercel.app (Vercel tự deploy mỗi lần push lên `main`)

## Tính năng
- **Sản phẩm**: danh sách sản phẩm thật chia theo danh mục (Nutrilite, Artistry, Cá nhân, Gia dụng), card có hình, tên, giá bán lẻ. Tìm kiếm không cần gõ dấu, lọc theo danh mục.
- **Giá NPP**: công tắc trên header. Bật thì tab Sản phẩm hiện thêm giá NPP và PV/BV; tab Đơn hàng tính theo giá NPP và hiện tổng PV/BV.
- **Đơn hàng**: gõ tìm rồi chạm để thêm sản phẩm, chỉnh số lượng, tự tính tổng. Có đơn mẫu (Combo F.Fit), hàng tặng, thông tin chuyển khoản ACB kèm QR, xuất ảnh bill.
- **Liên kết**: các link hữu ích chia nhóm (Sản phẩm, Kinh doanh, Bài nghe).

## Chạy thử
Chỉ cần mở `index.html` bằng trình duyệt. Hoặc chạy server tĩnh:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

## Cập nhật dữ liệu
- **Sản phẩm**: sửa `data.js` (tên, mã, giá bán lẻ, giá NPP, PV, BV, ảnh, link). Đơn mẫu cũng nằm trong file này (`TEMPLATES`).
- **Liên kết**: sửa `links.js`.
- Giá nhập dạng số, không dấu chấm/phẩy. Ví dụ `1041000`.

## Cấu trúc
| File | Vai trò |
|------|---------|
| `index.html` | Khung giao diện, 3 tab |
| `styles.css` | Giao diện, mobile-first |
| `data.js` | Dữ liệu sản phẩm và đơn mẫu |
| `links.js` | Dữ liệu liên kết |
| `app.js` | Logic tìm kiếm, tính tiền, xuất bill |
| `assets/qr-acb.jpg` | Mã QR chuyển khoản |
| `vercel.json` | Cấu hình cache cho Vercel |
