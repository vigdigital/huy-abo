/* ===================== Tiện ích ===================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Định dạng tiền VNĐ
const fmt = (n) => n.toLocaleString("vi-VN") + " ₫";

// Tìm danh mục theo id
const catOf = (id) => CATEGORIES.find((c) => c.id === id) || { name: "", color: "#888" };

// Gán id ổn định cho từng sản phẩm (theo vị trí trong mảng)
PRODUCTS.forEach((p, i) => (p.id = i));

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
const order = new Map(); // productId -> quantity

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
  const term = searchTerm.trim().toLowerCase();
  const items = PRODUCTS.filter((p) => {
    const okCat = activeCategory === "all" || p.category === activeCategory;
    const okTerm = !term || p.name.toLowerCase().includes(term);
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
      return `
      <article class="card">
        ${media}
        <div class="card-body">
          <span class="card-cat" style="color:${c.color}">${c.name}</span>
          <h3 class="card-name">${p.name}</h3>
          <div class="card-foot">
            <span class="card-price">${fmt(p.price)}</span>
            <button class="btn-add" data-add="${p.id}" aria-label="Thêm vào đơn">+</button>
          </div>
        </div>
      </article>`;
    })
    .join("");

  $$("[data-add]", list).forEach((btn) =>
    btn.addEventListener("click", () => {
      addToOrder(Number(btn.dataset.add));
      btn.classList.add("added");
      btn.textContent = "✓";
      setTimeout(() => {
        btn.classList.remove("added");
        btn.textContent = "+";
      }, 700);
    })
  );
}

/* ===================== Trang Đơn hàng ===================== */
function renderOrderSelect() {
  const sel = $("#order-product");
  sel.innerHTML = CATEGORIES.map((c) => {
    const opts = PRODUCTS.filter((p) => p.category === c.id)
      .map((p) => `<option value="${p.id}">${p.name} — ${fmt(p.price)}</option>`)
      .join("");
    return `<optgroup label="${c.name}">${opts}</optgroup>`;
  }).join("");
}

function addToOrder(id, qty = 1) {
  order.set(id, (order.get(id) || 0) + qty);
  renderOrder();
}

function setQty(id, qty) {
  if (qty <= 0) order.delete(id);
  else order.set(id, qty);
  renderOrder();
}

function renderOrder() {
  const wrap = $("#order-items");
  const ids = [...order.keys()];

  $("#empty-order").hidden = ids.length !== 0;
  $("#order-summary").hidden = ids.length === 0;

  wrap.innerHTML = ids
    .map((id) => {
      const p = PRODUCTS[id];
      const qty = order.get(id);
      const line = p.price * qty;
      return `
      <div class="order-row">
        <img class="order-img" src="${imgSrc(p)}" alt="${p.name}" />
        <div class="order-info">
          <h4 class="order-name">${p.name}</h4>
          <span class="order-unit">${fmt(p.price)}</span>
        </div>
        <div class="qty">
          <button class="qty-btn" data-dec="${id}" aria-label="Giảm">−</button>
          <input class="qty-input" data-qty="${id}" type="number" min="1" value="${qty}" inputmode="numeric" />
          <button class="qty-btn" data-inc="${id}" aria-label="Tăng">+</button>
        </div>
        <div class="order-line">
          <span class="line-total">${fmt(line)}</span>
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
  const totalMoney = ids.reduce((a, id) => a + PRODUCTS[id].price * order.get(id), 0);
  $("#summary-count").textContent = totalItems;
  $("#summary-total").textContent = fmt(totalMoney);

  const badge = $("#cart-badge");
  badge.textContent = totalItems;
  badge.hidden = totalItems === 0;
}

/* ===================== Điều hướng tab ===================== */
function showView(view) {
  $("#view-products").hidden = view !== "products";
  $("#view-order").hidden = view !== "order";
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === view));
  window.scrollTo({ top: 0 });
}

/* ===================== Khởi tạo ===================== */
$("#search").addEventListener("input", (e) => {
  searchTerm = e.target.value;
  renderProducts();
});

$("#add-to-order").addEventListener("click", () => {
  addToOrder(Number($("#order-product").value));
});

$("#clear-order").addEventListener("click", () => {
  if (confirm("Xóa toàn bộ đơn hàng?")) {
    order.clear();
    renderOrder();
  }
});

$$(".tab").forEach((t) => t.addEventListener("click", () => showView(t.dataset.view)));

renderChips();
renderProducts();
renderOrderSelect();
renderOrder();
