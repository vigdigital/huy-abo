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

   ⚠️ Nutrilite: dữ liệu THẬT. Artistry / Chăm sóc cá nhân / Chăm sóc nhà cửa
      hiện vẫn là GIÁ MẪU — hãy cập nhật theo bảng giá thật.
   ============================================================ */

const CATEGORIES = [
  { id: "nutrilite",  name: "Nutrilite",            color: "#2E7D32" }, // Thực phẩm bổ sung
  { id: "artistry",   name: "Artistry",             color: "#C2185B" }, // Mỹ phẩm
  { id: "personal",   name: "Cá nhân",              color: "#00838F" },
  { id: "home",       name: "Gia dụng",             color: "#F9A825" },
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
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite GreenTrim",
    code: "117085",
    price: 923000,      // giá bán lẻ khuyến nghị
    priceNpp: 839000,   // giá nhà phân phối
    pv: 29.0,
    bv: 776852,
    img: "https://media.amway.com.vn/sys-master/images/h4e/h59/11159810506782/117085-20250530_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/117085",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Heart Health CoQ10",
    code: "860100",
    price: 1168000,     // giá bán lẻ khuyến nghị
    priceNpp: 1062000,  // giá nhà phân phối
    pv: 36.7,
    bv: 983333,
    img: "https://media.amway.com.vn/sys-master/images/h46/h17/11110224986142/860100-20250415_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/860100",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Vitamin E",
    code: "426100",
    price: 636000,      // giá bán lẻ khuyến nghị
    priceNpp: 578000,   // giá nhà phân phối
    pv: 19.95,
    bv: 535185,
    img: "https://media.amway.com.vn/sys-master/images/h05/h54/10860313411614/A4261_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/426100",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Liver Health",
    code: "808400",
    price: 959000,      // giá bán lẻ khuyến nghị
    priceNpp: 872000,   // giá nhà phân phối
    pv: 30.15,
    bv: 807407,
    img: "https://media.amway.com.vn/sys-master/images/h9b/h6e/10901770338334/A0804-Oct2024_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/808400",
  },
  {
    category: "nutrilite",
    name: "BodyKey by Nutrilite – Vị Sô Cô La",
    code: "124490",
    price: 1010000,     // giá bán lẻ khuyến nghị
    priceNpp: 918000,   // giá nhà phân phối
    pv: 31.7,
    bv: 850000,
    img: "https://media.amway.com.vn/sys-master/images/h81/ha0/10864854106142/124490_Sep2024_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124490",
  },
  {
    category: "nutrilite",
    name: "BodyKey by Nutrilite – Vị Cà Phê",
    code: "124492",
    price: 1155000,     // giá bán lẻ khuyến nghị
    priceNpp: 1050000,  // giá nhà phân phối
    pv: 36.3,
    bv: 972222,
    img: "https://media.amway.com.vn/sys-master/images/hff/hdc/10941247193118/124492-241120_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124492",
  },
  {
    category: "nutrilite",
    name: "BodyKey by Nutrilite – Vị Trà Sữa",
    code: "124499",
    price: 1010000,     // giá bán lẻ khuyến nghị
    priceNpp: 918000,   // giá nhà phân phối
    pv: 31.7,
    bv: 850000,
    img: "https://media.amway.com.vn/sys-master/images/h85/hb8/10285292191774/124499_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124499",
  },
  {
    category: "nutrilite",
    name: "BodyKey by Nutrilite – Ngũ Cốc",
    code: "315512",
    price: 1430000,     // giá bán lẻ khuyến nghị
    priceNpp: 1300000,  // giá nhà phân phối
    pv: 44.9,
    bv: 1203704,
    img: "https://media.amway.com.vn/sys-master/images/h71/hb0/11141680758814/315512_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/315512",
  },
  {
    category: "nutrilite",
    name: "TPBVSK Nutrilite All Plant Protein Powder",
    code: "110415",
    price: 905000,      // giá bán lẻ khuyến nghị
    priceNpp: 823000,   // giá nhà phân phối
    pv: 28.45,
    bv: 762037,
    img: "https://media.amway.com.vn/sys-master/images/h42/hf4/11334153371678/110415-20251031_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/110415",
  },
  {
    category: "nutrilite",
    name: "Nutrilite Protein Powder – Vị Sô Cô La",
    code: "117580",
    price: 1005000,     // giá bán lẻ khuyến nghị
    priceNpp: 914000,   // giá nhà phân phối
    pv: 31.6,
    bv: 846296,
    img: "https://media.amway.com.vn/sys-master/images/h66/h0b/11266726363166/117580-20250905_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/117580",
  },
  {
    category: "nutrilite",
    name: "Nutrilite Soy Protein Powder Mixed – Vị Trà Xanh",
    code: "102578",
    price: 943000,      // giá bán lẻ khuyến nghị
    priceNpp: 857000,   // giá nhà phân phối
    pv: 29.6,
    bv: 793519,
    img: "https://media.amway.com.vn/sys-master/images/h7a/h42/10764592152606/102578VN-240628_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/102578",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Double X (có khay)",
    code: "120843",
    price: 1469000,     // giá bán lẻ khuyến nghị
    priceNpp: 1335000,  // giá nhà phân phối
    pv: 46.1,
    bv: 1236111,
    img: "https://media.amway.com.vn/sys-master/images/he3/hfa/11334161694750/120843VN-20251031_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/120843",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Double X (không khay)",
    code: "120844",
    price: 1390000,     // giá bán lẻ khuyến nghị
    priceNpp: 1264000,  // giá nhà phân phối
    pv: 43.65,
    bv: 1170370,
    img: "https://media.amway.com.vn/sys-master/images/h64/h89/11289347751966/120844-20250926_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/120844",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Vitamin C Extended Release (60 viên)",
    code: "109745",
    price: 407000,      // giá bán lẻ khuyến nghị
    priceNpp: 370000,   // giá nhà phân phối
    pv: 12.8,
    bv: 342593,
    img: "https://media.amway.com.vn/sys-master/images/hd9/h0b/10805882486814/c-extended-60-with-pill_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/109745",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Vitamin C Extended Release (180 viên)",
    code: "109747",
    price: 1089000,     // giá bán lẻ khuyến nghị
    priceNpp: 990000,   // giá nhà phân phối
    pv: 34.2,
    bv: 916667,
    img: "https://media.amway.com.vn/sys-master/images/h0a/h6f/10805878030366/109747-with-pill_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/109747",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Cal Mag D",
    code: "110610",
    price: 715000,      // giá bán lẻ khuyến nghị
    priceNpp: 650000,   // giá nhà phân phối
    pv: 22.45,
    bv: 601852,
    img: "https://media.amway.com.vn/sys-master/images/hb2/h53/10658313535518/110610_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/110610",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Iron Folic",
    code: "102046",
    price: 281000,      // giá bán lẻ khuyến nghị
    priceNpp: 255000,   // giá nhà phân phối
    pv: 8.8,
    bv: 236111,
    img: "https://media.amway.com.vn/sys-master/images/hc4/h49/10868156006430/102046-1_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/102046",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Vitamin B Dual-Action",
    code: "110171",
    price: 506000,      // giá bán lẻ khuyến nghị
    priceNpp: 460000,   // giá nhà phân phối
    pv: 15.9,
    bv: 425926,
    img: "https://media.amway.com.vn/sys-master/images/h06/h22/10983052967966/110171-1_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/110171",
  },
  {
    category: "nutrilite",
    name: "Bình lắc Nutrilite 710ml",
    code: "328888",
    price: 231000,      // giá bán lẻ khuyến nghị
    priceNpp: 210000,   // giá nhà phân phối
    img: "https://media.amway.com.vn/sys-master/images/hd5/h7b/11253436973086/328888-1_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/328888",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Vision Health Plus",
    code: "124321",
    price: 913000,      // giá bán lẻ khuyến nghị
    priceNpp: 830000,   // giá nhà phân phối
    pv: 28.7,
    bv: 768519,
    img: "https://media.amway.com.vn/sys-master/images/h77/h41/11246109065246/124321_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124321",
  },
  {
    category: "nutrilite",
    name: "TPBVSK Nutrilite Advanced Triple Omega-3",
    code: "126136",
    price: 858000,      // giá bán lẻ khuyến nghị
    priceNpp: 780000,   // giá nhà phân phối
    pv: 26.95,
    bv: 722222,
    img: "https://media.amway.com.vn/sys-master/images/h94/h30/11334164414494/126136vn-20251031_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/126136",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Joint Health",
    code: "104664",
    price: 990000,      // giá bán lẻ khuyến nghị
    priceNpp: 900000,   // giá nhà phân phối
    pv: 31.1,
    bv: 833333,
    img: "https://media.amway.com.vn/sys-master/images/ha4/h27/10710265298974/104664-1_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/104664",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Fiber Powder",
    code: "102736",
    price: 770000,      // giá bán lẻ khuyến nghị
    priceNpp: 700000,   // giá nhà phân phối
    pv: 24.2,
    bv: 648148,
    img: "https://media.amway.com.vn/sys-master/images/ha0/h2a/11334156156958/102736-20251031_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/102736",
  },
  {
    category: "nutrilite",
    name: "TP BVSK Nutrilite Daily",
    code: "126009",
    price: 292000,      // giá bán lẻ khuyến nghị
    priceNpp: 265000,   // giá nhà phân phối
    pv: 9.15,
    bv: 245370,
    img: "https://media.amway.com.vn/sys-master/images/h90/h19/10471543373854/126009VN_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/126009",
  },
  {
    category: "nutrilite",
    name: "TPBVSK Nutrilite Kids Daily",
    code: "123043",
    price: 317000,      // giá bán lẻ khuyến nghị
    priceNpp: 288000,   // giá nhà phân phối
    pv: 9.95,
    bv: 266667,
    img: "https://media.amway.com.vn/sys-master/images/hcc/hd6/11465472802846/123043-20260226-1400_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/123043",
  },
  {
    category: "nutrilite",
    name: "TPBVSK Nutrilite Nutrikids Omega-3 Jelly",
    code: "300920",
    price: 660000,      // giá bán lẻ khuyến nghị
    priceNpp: 600000,   // giá nhà phân phối
    pv: 20.75,
    bv: 555556,
    img: "https://media.amway.com.vn/sys-master/images/h80/h64/10540061687838/300920_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/300920",
  },

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
  {
    category: "personal",
    name: "Kem đánh răng Glister - Bạc hà",
    code: "124106",
    price: 153000,      // giá bán lẻ khuyến nghị
    priceNpp: 139000,   // giá nhà phân phối
    pv: 4.8,
    bv: 128704,
    img: "https://media.amway.com.vn/sys-master/images/h15/h7e/10292279771166/124106_001_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124106",
  },
  {
    category: "personal",
    name: "Kem đánh răng Glister - Trà trắng",
    code: "319372",
    price: 153000,      // giá bán lẻ khuyến nghị
    priceNpp: 139000,   // giá nhà phân phối
    pv: 4.8,
    bv: 128704,
    img: "https://media.amway.com.vn/sys-master/images/h2e/h5f/10868546732062/319372-1_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/319372",
  },
  {
    category: "personal",
    name: "Xịt miệng Glister Mint",
    code: "124111",
    price: 150000,      // giá bán lẻ khuyến nghị
    priceNpp: 136000,   // giá nhà phân phối
    pv: 4.7,
    bv: 125926,
    img: "https://media.amway.com.vn/sys-master/images/h49/h1a/10292475232286/124111_image_1_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124111",
  },
  {
    category: "personal",
    name: "Nước súc miệng đậm đặc Glister",
    code: "124108",
    price: 297000,      // giá bán lẻ khuyến nghị
    priceNpp: 270000,   // giá nhà phân phối
    pv: 9.35,
    bv: 250000,
    img: "https://media.amway.com.vn/sys-master/images/h12/h22/10292459241502/124108_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124108",
  },
  {
    category: "personal",
    name: "Bàn chải đánh răng lông mềm Glister",
    code: "124109",
    price: 297000,      // giá bán lẻ khuyến nghị
    priceNpp: 270000,   // giá nhà phân phối
    pv: 9.35,
    bv: 250000,
    img: "https://media.amway.com.vn/sys-master/images/h7c/h3a/10292466745374/124109_2_image_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124109",
  },
  {
    category: "personal",
    name: "Bàn chải đánh răng lông vừa Glister",
    code: "124110",
    price: 297000,      // giá bán lẻ khuyến nghị
    priceNpp: 270000,   // giá nhà phân phối
    pv: 9.35,
    bv: 250000,
    img: "https://media.amway.com.vn/sys-master/images/h9f/h66/10307460595742/124110_image_2_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124110",
  },
  {
    category: "personal",
    name: "Chỉ vệ sinh răng Glister",
    code: "124112",
    price: 174000,      // giá bán lẻ khuyến nghị
    priceNpp: 158000,   // giá nhà phân phối
    pv: 5.45,
    bv: 146296,
    img: "https://media.amway.com.vn/sys-master/images/h30/h8a/10325970190366/124112_image_3_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/124112",
  },
  { category: "personal", name: "Dầu gội G&H Nourish+",                      price: 320000,  img: "" },
  { category: "personal", name: "Dầu xả G&H Nourish+",                       price: 320000,  img: "" },
  {
    category: "personal",
    name: "Sữa tắm dưỡng ẩm G&H",
    code: "125890", // ⚠️ cần xác nhận: ảnh có tên file 126890
    price: 257000,      // giá bán lẻ khuyến nghị
    priceNpp: 234000,   // giá nhà phân phối
    pv: 8.1,
    bv: 216667,
    img: "https://media.amway.com.vn/sys-master/images/hcc/hf0/10745298878494/126890VN_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/125890",
  },
  {
    category: "personal",
    name: "Sữa tắm tẩy tế bào chết G&H",
    code: "125892",
    price: 257000,      // giá bán lẻ khuyến nghị
    priceNpp: 234000,   // giá nhà phân phối
    pv: 8.1,
    bv: 216667,
    img: "https://media.amway.com.vn/sys-master/images/h51/h6c/10746169196574/125892VN_amway-WF_Product_588Wx588H",
    link: "https://www.amway.com.vn/vn/p/125892",
  },
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

/* ============================================================
   ĐƠN MẪU (TEMPLATE) — combo pha sẵn số lượng
   ------------------------------------------------------------
   - Mỗi item trỏ tới sản phẩm bằng "code" (mã hàng hóa).
   - qty  : số lượng.
   - gift : true => hàng tặng, thành tiền = 0 (hiển thị "Tặng").
   ============================================================ */
const TEMPLATES = [
  {
    id: "ffit",
    name: "Combo F.Fit",
    items: [
      { code: "124490", qty: 8 },  // BodyKey vị Sô Cô La
      { code: "110415", qty: 10 }, // All Plant Protein Powder
      { code: "117085", qty: 2 },  // GreenTrim
      { code: "103050", qty: 1 },  // CB Plus
      { code: "102736", qty: 4 },  // Fiber Powder (xơ bột)
      { code: "126136", qty: 2 },  // Advanced Triple Omega-3
      { code: "120843", qty: 2 },  // Double X (có khay)
      { code: "120571", qty: 2 },  // Probiotic
      { code: "328888", qty: 1, gift: true }, // Bình lắc — Tặng
    ],
  },
];
