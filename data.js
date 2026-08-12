/* ============================================================
   DỮ LIỆU SẢN PHẨM AMWAY
   ------------------------------------------------------------
   Cách sửa (các trường của một sản phẩm):
   - name     : tên sản phẩm (bắt buộc)
   - price    : GIÁ BÁN LẺ khuyến nghị, VNĐ. Nhập số, không dấu chấm/phẩy. Ví dụ 1041000.
   - priceNpp : GIÁ NHÀ PHÂN PHỐI (tùy chọn). Chỉ hiện khi bật toggle "Giá NPP".
   - pv       : điểm PV (tùy chọn). Ví dụ 32.7
   - bv       : điểm BV (tùy chọn). Ví dụ 875926
   - img      : link ảnh (https://...). Để trống "" sẽ tự tạo ảnh chữ cái.
   - link     : link trang gốc sản phẩm (tùy chọn). Có link thì bấm ảnh sẽ mở trang đó.
   - code     : mã hàng hóa (tùy chọn), ví dụ "120571".
   - Muốn thêm/bớt sản phẩm: thêm/xóa một dòng { ... } trong danh mục.
   - Muốn đổi danh mục: sửa "name" trong CATEGORIES (id giữ nguyên).

   ⚠️ GIÁ BÊN DƯỚI LÀ GIÁ MẪU — hãy cập nhật theo bảng giá thật.
   ============================================================ */

const CATEGORIES = [
  { id: "nutrilite",  name: "Nutrilite",            color: "#2E7D32" }, // Thực phẩm bổ sung
  { id: "artistry",   name: "Artistry",             color: "#C2185B" }, // Mỹ phẩm
  { id: "personal",   name: "Chăm sóc cá nhân",     color: "#00838F" },
  { id: "home",       name: "Chăm sóc nhà cửa",     color: "#F9A825" },
];

const PRODUCTS = [
  // ---------- Nutrilite ----------
  // ✅ Dữ liệu THẬT (mẫu chuẩn) — lấy từ amway.com.vn/vn/p/120571
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Probiotic",
    code: "120571",
    price: 1041000,     // giá bán lẻ khuyến nghị
    priceNpp: 946000,   // giá nhà phân phối
    pv: 32.7,
    bv: 875926,
    img: "https://media.amway.com.vn/sys-master/images/h32/hcf/11177284141086/120571VN-20250616_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/120571",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite CB Plus",
    code: "103050",
    price: 901000,      // giá bán lẻ khuyến nghị
    priceNpp: 819000,   // giá nhà phân phối
    pv: 28.3,
    bv: 758333,
    img: "https://media.amway.com.vn/sys-master/images/hb8/h98/11156377567262/103050-20250526-1728_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/103050",
  },

  { category: "nutrilite", name: "Nutrilite Double X (hộp tiếp)",             price: 1855000, img: "" },
  { category: "nutrilite", name: "Nutrilite Protein thực vật",               price: 1290000, img: "" },
  { category: "nutrilite", name: "Nutrilite Vitamin C thẩm thấu chậm",       price: 585000,  img: "" },
  { category: "nutrilite", name: "Nutrilite Calcium Magnesium",              price: 655000,  img: "" },
  { category: "nutrilite", name: "Nutrilite Bổ sung sắt & Folic",            price: 430000,  img: "" },
  { category: "nutrilite", name: "Nutrilite Omega-3 (Salmon Omega)",         price: 720000,  img: "" },
  { category: "nutrilite", name: "Nutrilite Bio C 2:1",                      price: 615000,  img: "" },
  { category: "nutrilite", name: "Nutrilite Multi-Carotene",                 price: 690000,  img: "" },
  { category: "nutrilite", name: "Nutrilite Garlic (Tỏi)",                   price: 545000,  img: "" },
  { category: "nutrilite", name: "Nutrilite Cà gai leo Milk Thistle",        price: 760000,  img: "" },
  { category: "nutrilite", name: "Nutrilite Glucosamine",                    price: 815000,  img: "" },
  { category: "nutrilite", name: "Nutrilite Chất xơ hòa tan",                price: 505000,  img: "" },

  // ---------- Artistry ----------
  { category: "artistry", name: "Artistry Supreme LX Kem dưỡng",             price: 8900000, img: "" },
  { category: "artistry", name: "Artistry Signature Select Serum",           price: 2150000, img: "" },
  { category: "artistry", name: "Artistry Hydra-V Gel dưỡng ẩm",             price: 1180000, img: "" },
  { category: "artistry", name: "Artistry Ideal Radiance Kem chống nắng",    price: 990000,  img: "" },
  { category: "artistry", name: "Artistry Sữa rửa mặt tạo bọt",              price: 720000,  img: "" },
  { category: "artistry", name: "Artistry Nước hoa hồng cân bằng",           price: 680000,  img: "" },
  { category: "artistry", name: "Artistry Studio Kem nền dạng lỏng",         price: 850000,  img: "" },
  { category: "artistry", name: "Artistry Son môi Signature Color",          price: 620000,  img: "" },
  { category: "artistry", name: "Artistry Mặt nạ dưỡng ẩm",                  price: 1050000, img: "" },
  { category: "artistry", name: "Artistry Kem mắt Signature Select",         price: 1980000, img: "" },

  // ---------- Chăm sóc cá nhân ----------
  { category: "personal", name: "Kem đánh răng Glister",                     price: 165000,  img: "" },
  { category: "personal", name: "Nước súc miệng Glister",                    price: 245000,  img: "" },
  { category: "personal", name: "Dầu gội G&H Nourish+",                      price: 320000,  img: "" },
  { category: "personal", name: "Dầu xả G&H Nourish+",                       price: 320000,  img: "" },
  { category: "personal", name: "Sữa tắm G&H Refresh+",                      price: 295000,  img: "" },
  { category: "personal", name: "Sữa dưỡng thể G&H Protect+",                price: 330000,  img: "" },
  { category: "personal", name: "Xà phòng G&H bánh (3 cục)",                 price: 210000,  img: "" },
  { category: "personal", name: "Lăn khử mùi G&H",                           price: 185000,  img: "" },
  { category: "personal", name: "Nước rửa tay Glister",                      price: 175000,  img: "" },

  // ---------- Chăm sóc nhà cửa ----------
  { category: "home", name: "Nước rửa chén Dish Drops",                      price: 285000,  img: "" },
  { category: "home", name: "Nước giặt SA8 (1L)",                            price: 465000,  img: "" },
  { category: "home", name: "Bột giặt SA8",                                  price: 520000,  img: "" },
  { category: "home", name: "Nước xả vải SA8",                               price: 310000,  img: "" },
  { category: "home", name: "Chất tẩy rửa đa năng L.O.C.",                   price: 265000,  img: "" },
  { category: "home", name: "Nước lau kính L.O.C.",                          price: 240000,  img: "" },
  { category: "home", name: "Nước lau sàn L.O.C.",                           price: 275000,  img: "" },
  { category: "home", name: "Hệ thống lọc nước eSpring (lõi lọc)",           price: 4850000, img: "" },
  { category: "home", name: "Bình đựng nước Amway (bộ)",                     price: 390000,  img: "" },
];
