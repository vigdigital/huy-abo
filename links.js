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

  { group: "business", title: "Kinh doanh Amway bằng Tái tiêu dùng", url: "https://www.facebook.com/share/v/1E9i2bHPrn/?mibextid=wwXIfr", note: "Video (Facebook)" },
];
