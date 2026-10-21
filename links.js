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
  // Ví dụ:
  // { group: "product", title: "Catalogue Nutrilite", url: "https://...", note: "PDF" },
];
