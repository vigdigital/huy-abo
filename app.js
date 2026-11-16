/* ===================== Tiện ích ===================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Định dạng tiền VNĐ
const fmt = (n) => n.toLocaleString("vi-VN") + " ₫";
// Định dạng số (PV/BV)
const fmtNum = (n) => Number(n).toLocaleString("vi-VN");

// Chuẩn hoá để tìm kiếm không phân biệt dấu/hoa thường ("kem danh rang" khớp "Kem đánh răng")
const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");
const matches = (p, t) => norm(p.name).includes(t) || (p.code || "").includes(t);

// Tìm danh mục theo id
const catOf = (id) => CATEGORIES.find((c) => c.id === id) || { name: "", color: "#888" };

// Gán id ổn định cho từng sản phẩm (theo vị trí trong mảng)
PRODUCTS.forEach((p, i) => (p.id = i));

// Tra id sản phẩm theo mã hàng hóa (dùng cho đơn mẫu)
const byCode = {};
PRODUCTS.forEach((p) => {
  if (p.code) byCode[p.code] = p.id;
});

// Ảnh placeholder từ chữ cái đầu (SVG inline, không cần file ngoài)
function placeholder(p) {
  const c = catOf(p.category);
  const letter = (p.name.replace(/^[^A-Za-zÀ-ỹ]+/, "")[0] || "A").toUpperCase();
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
    `<rect width='100' height='100' rx='16' fill='${c.color}22'/>` +
    `<text x='50' y='63' font-size='46' font-family='Arial' font-weight='700' ` +
    `text-anchor='middle' fill='${c.color}'>${letter}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

const imgSrc = (p) => (p.img && p.img.trim() ? p.img : placeholder(p));

/* ===================== Trạng thái ===================== */
let activeCategory = "all";
let searchTerm = "";
// Hiện giá nhà phân phối (NPP, PV/BV). Chỉ bật được khi đã đăng nhập trên VPS:
// account.js bật theo lựa chọn đã lưu sau khi đăng nhập, công tắc nằm trong tab Tài khoản.
let showNpp = false;
const order = new Map(); // productId -> quantity
const gifts = new Set(); // productId là hàng tặng (giá 0)
let currentUser = null; // account.js gán khi đăng nhập (chỉ có trên VPS)

// Thoát ký tự HTML cho dữ liệu người dùng nhập
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// Người nhận tiền khi chưa đăng nhập: dùng ảnh QR gốc do ACB cấp
const DEFAULT_PAYEE = { bin: "970416", account: "140161319", holder: "Võ Minh Huy", img: "assets/qr-acb.jpg?v=16" };

// Người nhận tiền hiện hành. null = đã đăng nhập nhưng chưa nhập thông tin ngân hàng
// (không rơi về tài khoản mặc định, tránh khách chuyển nhầm tiền).
function payee() {
  if (!currentUser) return DEFAULT_PAYEE;
  if (!currentUser.bank_bin || !currentUser.bank_account) return null;
  return {
    bin: currentUser.bank_bin,
    account: currentUser.bank_account,
    holder: currentUser.bank_holder || currentUser.name || "",
  };
}

/* ===================== Trang Sản phẩm ===================== */
function renderChips() {
  const wrap = $("#category-chips");
  const chips = [{ id: "all", name: "Tất cả", color: "#0057B8" }, ...CATEGORIES];
  wrap.innerHTML = chips
    .map(
      (c) =>
        `<button class="chip ${c.id === activeCategory ? "active" : ""}" data-cat="${c.id}">${c.name}</button>`
    )
    .join("");
  $$(".chip", wrap).forEach((btn) =>
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      renderChips();
      renderProducts();
    })
  );
}

function renderProducts() {
  const list = $("#product-list");
  const term = norm(searchTerm.trim());
  const items = PRODUCTS.filter((p) => {
    const okCat = activeCategory === "all" || p.category === activeCategory;
    const okTerm = !term || matches(p, term);
    return okCat && okTerm;
  });

  $("#empty-products").hidden = items.length !== 0;

  list.innerHTML = items
    .map((p) => {
      const c = catOf(p.category);
      const imgTag = `<img class="card-img" src="${imgSrc(p)}" alt="${p.name}" loading="lazy" />`;
      const media = p.link
        ? `<a class="card-media" href="${p.link}" target="_blank" rel="noopener">${imgTag}</a>`
        : imgTag;
      const pvbv =
        showNpp && (p.pv != null || p.bv != null)
          ? `<div class="card-pvbv">${p.pv != null ? "PV " + fmtNum(p.pv) : ""}${
              p.pv != null && p.bv != null ? " · " : ""
            }${p.bv != null ? "BV " + fmtNum(p.bv) : ""}</div>`
          : "";
      const nppLine =
        showNpp && p.priceNpp ? `<div class="card-npp">NPP ${fmt(p.priceNpp)}</div>` : "";
      return `
      <article class="card">
        ${media}
        <div class="card-body">
          <span class="card-cat" style="color:${c.color}">${c.name}</span>
          <h3 class="card-name">${p.name}</h3>
          ${pvbv}
          <div class="card-foot">
            <div class="card-prices">
              <span class="card-price">${fmt(p.price)}</span>
              ${nppLine}
            </div>
            ${addBtn(p.id)}
          </div>
        </div>
      </article>`;
    })
    .join("");

  // Bấm + để thêm vào đơn (nút thành ✓), bấm ✓ để bỏ khỏi đơn
  $$("[data-add]", list).forEach((btn) =>
    btn.addEventListener("click", () => {
      const id = Number(btn.dataset.add);
      if (order.has(id)) setQty(id, 0);
      else addToOrder(id);
    })
  );
}

function addBtn(id) {
  const inCart = order.has(id);
  return `<button class="btn-add ${inCart ? "added" : ""}" data-add="${id}" type="button" aria-pressed="${inCart}"
    aria-label="${inCart ? "Bỏ khỏi đơn" : "Thêm vào đơn"}">${inCart ? "✓" : "+"}</button>`;
}

// Cập nhật trạng thái +/✓ trên trang Sản phẩm khi đơn thay đổi (kể cả sửa ở trang Đơn hàng)
function syncAddButtons() {
  $$("#product-list [data-add]").forEach((btn) => {
    const inCart = order.has(Number(btn.dataset.add));
    btn.classList.toggle("added", inCart);
    btn.textContent = inCart ? "✓" : "+";
    btn.setAttribute("aria-pressed", inCart);
    btn.setAttribute("aria-label", inCart ? "Bỏ khỏi đơn" : "Thêm vào đơn");
  });
}

/* ===================== Trang Đơn hàng ===================== */
function renderOrderResults() {
  const box = $("#order-results");
  const t = norm($("#order-search").value.trim());
  if (!t) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }
  const items = PRODUCTS.filter((p) => matches(p, t)).slice(0, 8);
  box.hidden = false;
  if (!items.length) {
    box.innerHTML = `<p class="result-empty">Không tìm thấy sản phẩm</p>`;
    return;
  }
  box.innerHTML = items
    .map((p) => {
      const inCart = order.get(p.id) || 0;
      const price = showNpp ? p.priceNpp ?? p.price : p.price;
      return `
      <button class="result-row" type="button" data-pick="${p.id}">
        <img class="result-img" src="${imgSrc(p)}" alt="" loading="lazy" />
        <span class="result-info">
          <span class="result-name">${p.name}</span>
          <span class="result-price">${fmt(price)}</span>
        </span>
        ${inCart ? `<span class="result-count">×${inCart}</span>` : ""}
        <span class="result-add" aria-hidden="true">+</span>
      </button>`;
    })
    .join("");
  $$("[data-pick]", box).forEach((btn) =>
    btn.addEventListener("click", () => addToOrder(Number(btn.dataset.pick)))
  );
}

function addToOrder(id, qty = 1) {
  order.set(id, (order.get(id) || 0) + qty);
  renderOrder();
}

function setQty(id, qty) {
  if (qty <= 0) {
    order.delete(id);
    gifts.delete(id);
  } else order.set(id, qty);
  renderOrder();
}

function renderOrder() {
  const wrap = $("#order-items");
  const ids = [...order.keys()];

  $("#empty-order").hidden = ids.length !== 0;
  $("#order-summary").hidden = ids.length === 0;
  $("#order-actions").hidden = ids.length === 0;

  wrap.innerHTML = ids
    .map((id) => {
      const p = PRODUCTS[id];
      const qty = order.get(id);
      const isGift = gifts.has(id);
      const unit = showNpp ? p.priceNpp ?? p.price : p.price;
      const line = isGift ? 0 : unit * qty;
      const giftTag = isGift ? `<span class="gift-tag">Tặng</span>` : "";
      return `
      <div class="order-row">
        <img class="order-img" src="${imgSrc(p)}" alt="${p.name}" />
        <div class="order-info">
          <h4 class="order-name">${p.name} ${giftTag}</h4>
          <span class="order-unit">${fmt(unit)}</span>
        </div>
        <div class="qty">
          <button class="qty-btn" data-dec="${id}" aria-label="Giảm">−</button>
          <input class="qty-input" data-qty="${id}" type="number" min="1" value="${qty}" inputmode="numeric" />
          <button class="qty-btn" data-inc="${id}" aria-label="Tăng">+</button>
        </div>
        <div class="order-line">
          <span class="line-total ${isGift ? "is-gift" : ""}">${isGift ? "Tặng" : fmt(line)}</span>
          <button class="line-remove" data-del="${id}" aria-label="Xóa">Xóa</button>
        </div>
      </div>`;
    })
    .join("");

  // Sự kiện tăng/giảm/xóa/nhập số lượng
  $$("[data-inc]", wrap).forEach((b) =>
    b.addEventListener("click", () => setQty(+b.dataset.inc, order.get(+b.dataset.inc) + 1))
  );
  $$("[data-dec]", wrap).forEach((b) =>
    b.addEventListener("click", () => setQty(+b.dataset.dec, order.get(+b.dataset.dec) - 1))
  );
  $$("[data-del]", wrap).forEach((b) =>
    b.addEventListener("click", () => setQty(+b.dataset.del, 0))
  );
  $$("[data-qty]", wrap).forEach((inp) =>
    inp.addEventListener("change", () => setQty(+inp.dataset.qty, Math.max(1, parseInt(inp.value) || 1)))
  );

  // Tổng kết
  const totalItems = [...order.values()].reduce((a, b) => a + b, 0);
  const priceOf = (id) => (showNpp ? PRODUCTS[id].priceNpp ?? PRODUCTS[id].price : PRODUCTS[id].price);
  const totalMoney = ids.reduce((a, id) => a + (gifts.has(id) ? 0 : priceOf(id) * order.get(id)), 0);
  const totalPv = ids.reduce((a, id) => a + (PRODUCTS[id].pv || 0) * order.get(id), 0);
  const totalBv = ids.reduce((a, id) => a + (PRODUCTS[id].bv || 0) * order.get(id), 0);
  $("#summary-count").textContent = totalItems;
  $("#summary-total").textContent = fmt(totalMoney);
  $("#summary-total-label").textContent = showNpp ? "Tổng giá NPP" : "Tổng bán lẻ";
  $("#summary-pv").textContent = fmtNum(Math.round(totalPv * 100) / 100);
  $("#summary-bv").textContent = fmtNum(totalBv);
  $("#row-pv").hidden = !showNpp;
  $("#row-bv").hidden = !showNpp;

  const badge = $("#cart-badge");
  badge.textContent = totalItems;
  badge.hidden = totalItems === 0;

  renderOrderResults(); // cập nhật số "×N" trong kết quả tìm kiếm
  syncAddButtons();
  renderPayment(totalMoney);
}

/* ===================== Thanh toán chuyển khoản ===================== */
// Vẽ mã QR (thư viện qrcode-generator) vào canvas, ô vuông nguyên pixel cho sắc nét
function drawQr(ctx, payload, x, y, size) {
  const q = qrcode(0, "M");
  q.addData(payload);
  q.make();
  const n = q.getModuleCount();
  const cell = Math.floor(size / (n + 4)); // chừa lề trắng 2 ô mỗi bên
  const off = Math.floor((size - cell * n) / 2);
  ctx.fillStyle = "#fff";
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = "#000";
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect(x + off + c * cell, y + off + r * cell, cell, cell);
}

function qrCanvas(payload, cssSize) {
  const c = document.createElement("canvas");
  c.width = c.height = cssSize * 2;
  c.className = "payment-qr";
  drawQr(c.getContext("2d"), payload, 0, 0, cssSize * 2);
  return c;
}

const payPayload = (p, amount) => vietQrPayload({ bin: p.bin, account: p.account, amount });

function renderPayment(total) {
  const p = payee();
  const box = $("#pay-qr");
  const info = $("#pay-info");
  const note = $("#pay-note");
  if (!p) {
    box.innerHTML = "";
    info.innerHTML = `<p class="pay-missing">Bạn chưa nhập thông tin nhận tiền.</p>
      <button type="button" class="link-btn" data-goto="account">Nhập ngay</button>`;
    note.textContent = "";
    return;
  }
  if (p.img) box.innerHTML = `<img class="payment-qr" src="${p.img}" alt="Mã QR chuyển khoản" />`;
  else box.replaceChildren(qrCanvas(payPayload(p, total), 200));
  info.innerHTML = `
    <div class="pay-row"><span>Ngân hàng</span><b>${esc(bankName(p.bin) || p.bin)}</b></div>
    <div class="pay-row"><span>Chủ tài khoản</span><b>${esc(p.holder)}</b></div>
    <div class="pay-row">
      <span>Số tài khoản</span>
      <b class="bank-acc">${esc(p.account)}</b>
      <button class="copy-btn" type="button" data-copy="${esc(p.account)}">Sao chép</button>
    </div>`;
  note.textContent =
    !p.img && total
      ? `Mã QR đã điền sẵn số tiền ${fmt(total)}. Vui lòng ghi nội dung là tên của bạn.`
      : "Quét mã QR hoặc chuyển khoản theo thông tin trên. Vui lòng ghi nội dung là tên của bạn.";
}

/* ===================== Đơn mẫu (template) ===================== */
function renderTemplates() {
  const wrap = $("#templates");
  if (!wrap || typeof TEMPLATES === "undefined" || !TEMPLATES.length) return;
  wrap.innerHTML =
    `<span class="tpl-label">Đơn mẫu:</span>` +
    TEMPLATES.map((t) => `<button class="tpl-btn" type="button" data-tpl="${t.id}">${t.name}</button>`).join("");
  $$(".tpl-btn", wrap).forEach((btn) =>
    btn.addEventListener("click", () => loadTemplate(btn.dataset.tpl))
  );
}

function loadTemplate(id) {
  const tpl = TEMPLATES.find((t) => t.id === id);
  if (!tpl) return;
  if (order.size && !confirm(`Nạp "${tpl.name}" và thay đơn hiện tại?`)) return;
  order.clear();
  gifts.clear();
  tpl.items.forEach((it) => {
    const pid = byCode[it.code];
    if (pid == null) return;
    order.set(pid, it.qty);
    if (it.gift) gifts.add(pid);
  });
  renderOrder();
  showView("order");
}

/* ===================== Liên kết ===================== */
function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function renderLinks() {
  if (typeof LINKS === "undefined") return;
  const wrap = $("#links-list");
  $("#empty-links").hidden = LINKS.length !== 0;
  const groups = LINK_GROUPS.filter((g) => LINKS.some((l) => l.group === g.id));
  wrap.innerHTML = groups
    .map((g) => {
      const items = LINKS.filter((l) => l.group === g.id)
        .map(
          (l) => `
        <a class="link-card" href="${l.url}" target="_blank" rel="noopener">
          <div class="link-main">
            <span class="link-title">${l.title}</span>
            ${l.note ? `<span class="link-note">${l.note}</span>` : ""}
            <span class="link-url">${hostOf(l.url)}</span>
          </div>
          <svg class="link-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M17 7H8M17 7v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </a>`
        )
        .join("");
      return `<section class="link-group"><h2 class="link-group-title">${g.name}</h2>${items}</section>`;
    })
    .join("");
}

/* ===================== Điều hướng tab ===================== */
function showView(view) {
  $("#view-products").hidden = view !== "products";
  $("#view-order").hidden = view !== "order";
  $("#view-links").hidden = view !== "links";
  $("#view-account").hidden = view !== "account";
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === view));
  window.scrollTo({ top: 0 });
}

/* ===================== Khởi tạo ===================== */
$("#search").addEventListener("input", (e) => {
  searchTerm = e.target.value;
  renderProducts();
});

$("#order-search").addEventListener("input", renderOrderResults);

$("#clear-order").addEventListener("click", () => {
  if (confirm("Xóa toàn bộ đơn hàng?")) {
    order.clear();
    gifts.clear();
    renderOrder();
  }
});

// Nút chuyển tab (vd. "Nhập ngay" thông tin nhận tiền)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-goto]");
  if (btn) showView(btn.dataset.goto);
});

// Sao chép số tài khoản
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".copy-btn");
  if (!btn) return;
  const text = btn.dataset.copy;
  const done = () => {
    const old = btn.textContent;
    btn.textContent = "Đã chép ✓";
    setTimeout(() => (btn.textContent = old), 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(done);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (_) {}
    document.body.removeChild(ta);
    done();
  }
});

/* ===================== Xuất ảnh đơn (bill) ===================== */
const qrImg = new Image();
qrImg.src = DEFAULT_PAYEE.img;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function nowStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function renderBill(ctx, measure) {
  const W = 760, PAD = 40, contentW = W - PAD * 2;
  const ids = [...order.keys()];
  const F = (s, w = 400) => `${w} ${s}px -apple-system,"Segoe UI",Roboto,Arial,sans-serif`;
  const wrap = (str, font, maxW) => {
    ctx.font = font;
    const parts = str.split(" ");
    const ls = [];
    let c = "";
    for (const w of parts) {
      const t = c ? c + " " + w : w;
      if (ctx.measureText(t).width > maxW && c) { ls.push(c); c = w; } else c = t;
    }
    if (c) ls.push(c);
    return ls;
  };
  const T = (str, x, y, font, color, align = "left") => {
    if (measure) return;
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
    ctx.fillText(str, x, y);
  };
  const HR = (y) => {
    if (measure) return;
    ctx.strokeStyle = "#e6eaf0"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, y + 0.5); ctx.lineTo(W - PAD, y + 0.5); ctx.stroke();
  };

  let y = 0;
  const hH = 92;
  if (!measure) {
    ctx.fillStyle = "#0057b8"; ctx.fillRect(0, 0, W, hH);
    ctx.fillStyle = "#fff"; rr(ctx, PAD, 28, 38, 38, 9); ctx.fill();
    T("A", PAD + 19, 56, F(26, 800), "#0057b8", "center");
  }
  T("Amway · Đơn hàng", PAD + 52, 52, F(27, 800), "#ffffff");
  const seller = currentUser ? `Người bán: ${currentUser.name || currentUser.phone} · ${currentUser.phone}` : "Tra cứu giá & tính tiền";
  T(seller, PAD + 52, 74, F(15, 400), "rgba(255,255,255,.85)");
  y = hH + 34;

  T("Ngày " + nowStr(), PAD, y, F(18, 400), "#6b7684"); y += 22;
  HR(y); y += 30;

  const priceOf = (id) => (showNpp ? PRODUCTS[id].priceNpp ?? PRODUCTS[id].price : PRODUCTS[id].price);
  let totalItems = 0, totalMoney = 0, totalPv = 0, totalBv = 0;
  ids.forEach((id, i) => {
    const p = PRODUCTS[id], qty = order.get(id), isGift = gifts.has(id);
    const unit = priceOf(id), lt = isGift ? 0 : unit * qty;
    totalItems += qty; totalMoney += lt; totalPv += (p.pv || 0) * qty; totalBv += (p.bv || 0) * qty;
    const nameLines = wrap(`${i + 1}. ${p.name}`, F(22, 700), contentW - 140);
    nameLines.forEach((nl) => { T(nl, PAD, y, F(22, 700), "#1b2430"); y += 28; });
    T(`${qty} × ${fmt(unit)}`, PAD, y, F(19, 400), "#6b7684");
    T(isGift ? "Tặng" : fmt(lt), W - PAD, y, F(21, 700), isGift ? "#16a34a" : "#003d82", "right");
    y += 32;
  });

  HR(y); y += 30;
  const row = (label, val, big) => {
    T(label, PAD, y, F(big ? 23 : 19, big ? 800 : 400), big ? "#1b2430" : "#6b7684");
    T(val, W - PAD, y, F(big ? 23 : 19, big ? 800 : 600), big ? "#003d82" : "#1b2430", "right");
    y += big ? 40 : 28;
  };
  row("Số mặt hàng", String(totalItems));
  if (showNpp) {
    row("Tổng PV", fmtNum(Math.round(totalPv * 100) / 100));
    row("Tổng BV", fmtNum(totalBv));
  }
  y += 4; HR(y); y += 36;
  row(showNpp ? "Tổng giá NPP" : "Tổng bán lẻ", fmt(totalMoney), true);
  y += 8; HR(y); y += 36;

  T("Thanh toán chuyển khoản", W / 2, y, F(21, 800), "#003d82", "center"); y += 30;
  const pay = payee();
  if (!pay) {
    T("Chưa có thông tin nhận tiền", W / 2, y, F(19, 400), "#6b7684", "center"); y += 34;
  } else {
    const qr = 250;
    if (!measure) {
      const qx = (W - qr) / 2;
      if (!pay.img) drawQr(ctx, payPayload(pay, totalMoney), qx, y, qr);
      else if (qrImg.complete && qrImg.naturalWidth > 0) ctx.drawImage(qrImg, qx, y, qr, qr);
      else { ctx.strokeStyle = "#e6eaf0"; ctx.strokeRect(qx, y, qr, qr); }
    }
    y += qr + 26;
    T(`${bankName(pay.bin) || pay.bin} · ${pay.holder}`, W / 2, y, F(20, 700), "#1b2430", "center"); y += 26;
    T("STK: " + pay.account, W / 2, y, F(20, 600), "#1b2430", "center"); y += 34;
  }
  T("Cảm ơn quý khách!", W / 2, y, F(18, 400), "#6b7684", "center"); y += 24;

  y += PAD;
  return y;
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "don-hang-amway.png";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportBill() {
  if (order.size === 0) { alert("Đơn hàng đang trống."); return; }
  const W = 760, scale = 2;
  const mctx = document.createElement("canvas").getContext("2d");
  const H = Math.ceil(renderBill(mctx, true));
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  renderBill(ctx, false);
  canvas.toBlob((blob) => {
    if (!blob) { alert("Không tạo được ảnh."); return; }
    const file = new File([blob], "don-hang-amway.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: "Đơn hàng Amway" }).catch(() => downloadBlob(blob));
    } else {
      downloadBlob(blob);
    }
  }, "image/png");
}

$("#export-bill").addEventListener("click", exportBill);

$$(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));

renderChips();
renderProducts();
renderTemplates();
renderOrder();
renderLinks();
