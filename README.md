# Tra cứu giá Amway

Trang web tĩnh, tối ưu cho mobile, dùng để **tra cứu giá sản phẩm Amway** và **tính tiền đơn hàng**.

## Tính năng
- **Sản phẩm**: ~40 sản phẩm chia 4 danh mục (Nutrilite, Artistry, Chăm sóc cá nhân, Chăm sóc nhà cửa), dạng card có hình, tên, giá bán lẻ. Có ô tìm kiếm và lọc theo danh mục.
- **Đơn hàng**: thêm sản phẩm, chỉnh số lượng (± hoặc nhập tay) → tự tính thành tiền từng dòng và **tổng cộng**.

## Chạy thử
Chỉ cần mở `index.html` bằng trình duyệt. Hoặc chạy server tĩnh:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

## Cập nhật dữ liệu
Mở file **`data.js`** và sửa:
- `price`: nhập số, không dấu chấm/phẩy. Ví dụ `1250000`.
- `img`: dán link ảnh (`https://...`). Để trống `""` sẽ tự tạo ảnh chữ cái.
- Thêm/bớt sản phẩm: thêm/xóa một dòng `{ ... }` trong danh mục tương ứng.

> ⚠️ Giá trong `data.js` hiện là **giá mẫu** — hãy thay bằng bảng giá thật.

## Cấu trúc
| File | Vai trò |
|------|---------|
| `index.html` | Khung giao diện, 2 tab |
| `styles.css` | Giao diện, mobile-first |
| `data.js` | **Dữ liệu sản phẩm** (nơi cần sửa) |
| `app.js` | Logic tìm kiếm, lọc, tính tiền |
