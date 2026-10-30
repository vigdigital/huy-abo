/* ============================================================
   DỮ LIỆU LIÊN KẾT HỮU ÍCH
   ------------------------------------------------------------
   - Mỗi liên kết: group (id nhóm), title (tên hiển thị),
     url (https://...), note (ghi chú ngắn, tùy chọn).
   - Thêm nhóm: thêm một dòng trong LINK_GROUPS (id không dấu, không trùng).
   - Thêm link: thêm một dòng { ... } vào LINKS.
   ============================================================ */

const LINK_GROUPS = [
  { id: "product",  name: "Sản phẩm" },
  { id: "business", name: "Kinh doanh" },
  { id: "audio",    name: "Bài nghe" },
];

const LINKS = [
  { group: "product", title: "Máy lọc nước eSpring", url: "https://www.facebook.com/share/p/1KNiuRAZ8b/?mibextid=wwXIfr", note: "Bài giới thiệu (Facebook)" },
  { group: "product", title: "Máy lọc không khí Atmosphere Mini", url: "https://www.facebook.com/share/r/1Dq7ZTcLho/?mibextid=wwXIfr", note: "Video (Facebook)" },
  { group: "product", title: "Satinique - chăm sóc tóc gãy rụng", url: "https://www.facebook.com/reel/29039204759055434", note: "Video (Facebook)" },
  { group: "product", title: "Minh hoạ sữa tắm G&H", url: "https://www.facebook.com/share/v/19U8o7cpye/?mibextid=wwXIfr", note: "Video (Facebook)" },
  { group: "product", title: "eSpring - Lõi lọc trước và sau khi sử dụng", url: "https://www.facebook.com/tu.tran.899755/posts/pfbid02u2npyyoN888GWTBnb7z5zm5gVjoHVy3mJQLNaPmtK9fiPyzJs1CnJD5nb7vXKDcfl", note: "Bài viết (Facebook)" },

  { group: "business", title: "Kinh doanh Amway bằng Tái tiêu dùng", url: "https://www.facebook.com/share/v/1E9i2bHPrn/?mibextid=wwXIfr", note: "Video (Facebook)" },
  { group: "business", title: "Câu chuyện thành công - Diamond Tâm & Tuyến", url: "https://www.facebook.com/share/v/1GusPU6gUc/?mibextid=wwXIfr", note: "Video (Facebook)" },
];
