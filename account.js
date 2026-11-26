/* ============================================================
   TÀI KHOẢN: đăng ký, đăng nhập, thông tin nhận tiền, đơn đã lưu, quản trị.
   Dữ liệu nằm trên Supabase (config.js). Chưa cấu hình Supabase thì web
   chạy như bản tĩnh: chỉ giá bán lẻ, ẩn tab Tài khoản.
   ============================================================ */

const accView = $("#view-account");
const sb =
  typeof supabase !== "undefined" && SUPABASE_URL && SUPABASE_ANON_KEY
    ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } })
    : null;

let profile = null; // hồ sơ của người đang đăng nhập (bảng profiles)
let qrObjectUrl = null; // ảnh QR đã tải về dạng blob: (vẽ được vào bill)
let loginNotice = ""; // thông báo hiện trên trang đăng nhập (vd. tài khoản bị khoá)

/* ----- Tiện ích ----- */
// SĐT là tên đăng nhập. Supabase cần email nên dùng email nội bộ, không gửi thư.
const PHONE_DOMAIN = "phone.huyabo.app";
function normPhone(s) {
  let d = String(s || "").replace(/\D/g, "");
  if (d.startsWith("84") && d.length === 11) d = "0" + d.slice(2);
  return /^0\d{9,10}$/.test(d) ? d : null;
}
const phoneEmail = (phone) => `${phone}@${PHONE_DOMAIN}`;
const cleanText = (s, max) => String(s || "").trim().replace(/\s+/g, " ").slice(0, max);
const isActive = () => !!profile && profile.status === "active";
const isAdmin = () => isActive() && profile.role === "admin";

// Đổi lỗi của Supabase sang tiếng Việt dễ hiểu
function vnError(err) {
  const m = String((err && (err.message || err.error_description || err)) || "");
  if (/invalid login credentials/i.test(m)) return "Sai số điện thoại hoặc mật khẩu";
  if (/already registered|already exists/i.test(m)) return "Số điện thoại này đã được đăng ký";
  if (/password should be|password.*characters/i.test(m)) return "Mật khẩu cần từ 6 ký tự";
  if (/rate limit|too many/i.test(m)) return "Thao tác quá nhiều lần, vui lòng thử lại sau ít phút";
  if (/failed to fetch|network|load failed/i.test(m)) return "Không kết nối được máy chủ";
  if (/jwt|not authenticated|auth session/i.test(m)) return "Phiên đăng nhập đã hết, vui lòng đăng nhập lại";
  return m || "Có lỗi xảy ra";
}

// Chạy một lệnh Supabase, có lỗi thì ném lỗi tiếng Việt
async function q(promise) {
  let res;
  try {
    res = await promise;
  } catch (e) {
    throw new Error(vnError(e));
  }
  if (res.error) throw new Error(vnError(res.error));
  return res.data;
}

/* ----- Giá NPP, PV, BV: chỉ tải về khi tài khoản đã được duyệt ----- */
let pricesLoaded = false;

async function loadPrices() {
  const rows = await q(sb.from("product_prices").select("code, price_npp, pv, bv"));
  const map = new Map(rows.map((r) => [r.code, r]));
  PRODUCTS.forEach((p) => {
    const r = map.get(p.code);
    if (r && r.price_npp != null) p.priceNpp = r.price_npp; else delete p.priceNpp;
    if (r && r.pv != null) p.pv = Number(r.pv); else delete p.pv;
    if (r && r.bv != null) p.bv = Number(r.bv); else delete p.bv;
  });
  pricesLoaded = true;
}

function clearPrices() {
  PRODUCTS.forEach((p) => {
    delete p.priceNpp;
    delete p.pv;
    delete p.bv;
  });
  pricesLoaded = false;
}

/* ----- Công tắc giá: nằm trong tab Tài khoản, không có chữ ----- */
const nppSaved = () => {
  try { return localStorage.getItem("showNpp") === "1"; } catch { return false; }
};

function applyNpp() {
  showNpp = isActive() && pricesLoaded && nppSaved();
  renderProducts();
  renderOrder();
}

/* ----- Ảnh QR nhận tiền (Storage, thư mục riêng của từng người) ----- */
const qrPath = (uid) => `${uid}/qr`;

async function fetchQr(p) {
  if (qrObjectUrl) {
    URL.revokeObjectURL(qrObjectUrl);
    qrObjectUrl = null;
  }
  if (!p || !p.qr_updated) return null;
  try {
    const blob = await q(sb.storage.from("qr").download(qrPath(p.id)));
    qrObjectUrl = URL.createObjectURL(blob);
  } catch {
    qrObjectUrl = null;
  }
  return qrObjectUrl;
}

/* ----- Nạp hồ sơ sau khi đăng nhập ----- */
async function loadProfile() {
  const { data } = await sb.auth.getSession();
  const session = data && data.session;
  if (!session) return applyProfile(null);
  let p;
  try {
    p = await q(sb.from("profiles").select("*").eq("id", session.user.id).single());
  } catch {
    return applyProfile(null);
  }
  if (p.status === "disabled") {
    loginNotice = "Tài khoản đã bị khoá. Liên hệ quản trị viên.";
    await sb.auth.signOut().catch(() => {});
    return applyProfile(null);
  }
  return applyProfile(p);
}

async function applyProfile(p) {
  profile = p;
  if (!p) {
    currentUser = null;
    await fetchQr(null);
    clearPrices();
  } else {
    const qrUrl = await fetchQr(p);
    currentUser = { ...p, qr_url: qrUrl };
    if (p.status === "active") await loadPrices().catch(clearPrices);
    else clearPrices();
  }
  applyNpp(); // vẽ lại sản phẩm, đơn hàng và khối thanh toán
  renderSaveOrder();
  renderAccount();
}

/* ----- Giao diện chung ----- */
const field = (label, attrs) => `<label class="acc-field"><span>${label}</span><input ${attrs} /></label>`;

function flash(form, text, ok = false) {
  const m = $("[data-msg]", form);
  if (!m) return;
  m.textContent = text;
  m.classList.toggle("ok", ok);
}

// Gửi form: khoá nút trong lúc chờ, hiện lỗi nếu có
function onSubmit(form, handler) {
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    flash(form, "");
    try {
      await handler(Object.fromEntries(new FormData(form)));
    } catch (err) {
      flash(form, err.message);
    } finally {
      btn.disabled = false;
    }
  });
}

const fmtDate = (s) => {
  const d = new Date(s), p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* ----- Trang đăng nhập / đăng ký ----- */
let authMode = "login";

function renderLogin() {
  const signup = authMode === "signup";
  accView.innerHTML = `
    <div class="acc-card">
      <h2 class="acc-title">${signup ? "Đăng ký tài khoản" : "Đăng nhập"}</h2>
      <p class="acc-hint">${
        signup
          ? "Đăng ký bằng số điện thoại. Tài khoản cần được duyệt trước khi dùng đầy đủ."
          : "Đăng nhập để lưu đơn và in bill với tài khoản nhận tiền của bạn."
      }</p>
      ${loginNotice ? `<p class="acc-msg">${esc(loginNotice)}</p>` : ""}
      <form id="auth-form" class="acc-form">
        ${field("Số điện thoại", `name="phone" type="tel" inputmode="tel" autocomplete="username" required`)}
        ${signup ? field("Họ tên", `name="name" maxlength="60" autocomplete="name" required`) : ""}
        ${field("Mật khẩu", `name="password" type="password" autocomplete="${signup ? "new-password" : "current-password"}" minlength="6" required`)}
        ${signup ? field("Nhập lại mật khẩu", `name="password2" type="password" autocomplete="new-password" minlength="6" required`) : ""}
        <p class="acc-msg" data-msg></p>
        <button class="btn-block" type="submit">${signup ? "Đăng ký" : "Đăng nhập"}</button>
      </form>
      <p class="acc-hint acc-switch">
        ${signup ? "Đã có tài khoản?" : "Chưa có tài khoản?"}
        <button type="button" class="link-btn" id="auth-switch">${signup ? "Đăng nhập" : "Đăng ký"}</button>
      </p>
    </div>`;

  $("#auth-switch").addEventListener("click", () => {
    authMode = signup ? "login" : "signup";
    loginNotice = "";
    renderLogin();
  });

  onSubmit($("#auth-form"), async (v) => {
    const phone = normPhone(v.phone);
    if (!phone) throw new Error("Số điện thoại không hợp lệ");
    if (signup) {
      const name = cleanText(v.name, 60);
      if (!name) throw new Error("Vui lòng nhập họ tên");
      if (v.password !== v.password2) throw new Error("Hai lần nhập mật khẩu không khớp");
      const data = await q(
        sb.auth.signUp({ email: phoneEmail(phone), password: v.password, options: { data: { phone, name } } })
      );
      if (!data.session) {
        // Chỉ xảy ra khi Supabase còn bật "Confirm email"
        throw new Error("Đã đăng ký nhưng chưa đăng nhập được. Vui lòng báo quản trị viên.");
      }
    } else {
      await q(sb.auth.signInWithPassword({ email: phoneEmail(phone), password: v.password }));
    }
    loginNotice = "";
    authMode = "login";
    await loadProfile();
  });
}

/* ----- Trang tài khoản ----- */
function renderAccount() {
  if (!sb) return;
  if (!profile) return renderLogin();

  const u = profile;
  const active = isActive();
  const admin = isAdmin();
  const bankOptions =
    `<option value="">— Chọn ngân hàng —</option>` +
    BANKS.map((b) => `<option value="${b.bin}" ${b.bin === u.bank_bin ? "selected" : ""}>${esc(b.name)}</option>`).join("");

  accView.innerHTML = `
    <div class="acc-card acc-head">
      <div>
        <div class="acc-name">${esc(u.name || u.phone)}</div>
        <div class="acc-sub">${esc(u.phone)}${admin ? " · Quản trị viên" : ""}</div>
      </div>
      <div class="acc-head-actions">
        ${
          active
            ? `<label class="npp-toggle">
          <input type="checkbox" id="toggle-npp" aria-label="Chế độ giá" ${showNpp ? "checked" : ""} />
          <span class="npp-track"><span class="npp-thumb"></span></span>
        </label>`
            : ""
        }
        <button id="logout-btn" class="btn-sm" type="button">Đăng xuất</button>
      </div>
    </div>

    ${
      u.status === "pending"
        ? `<div class="acc-card acc-pending">
      <h2 class="acc-title">Tài khoản đang chờ duyệt</h2>
      <p class="acc-hint">Quản trị viên sẽ duyệt sớm. Trong lúc chờ, bạn có thể nhập trước thông tin nhận tiền bên dưới.</p>
      <button id="recheck-btn" class="btn-sm" type="button">Kiểm tra lại</button>
    </div>`
        : ""
    }

    ${active ? `<div class="acc-card">
      <h2 class="acc-title">Đơn đã lưu</h2>
      <div id="order-history" class="order-history"><p class="acc-hint">Đang tải...</p></div>
    </div>` : ""}

    <div class="acc-card">
      <h2 class="acc-title">Thông tin nhận tiền</h2>
      <p class="acc-hint">Hiện ở trang Đơn hàng và trong ảnh bill. Mã QR tự tạo từ thông tin này, có điền sẵn số tiền của đơn.</p>
      <form id="profile-form" class="acc-form">
        ${field("Tên hiển thị", `name="name" value="${esc(u.name)}" maxlength="60" placeholder="VD: Võ Minh Huy"`)}
        <label class="acc-field"><span>Ngân hàng</span><select name="bank_bin">${bankOptions}</select></label>
        ${field("Số tài khoản", `name="bank_account" value="${esc(u.bank_account)}" inputmode="numeric" maxlength="19" autocomplete="off"`)}
        ${field("Tên chủ tài khoản", `name="bank_holder" value="${esc(u.bank_holder)}" maxlength="50" placeholder="VD: VO MINH HUY"`)}
        <p class="acc-msg" data-msg></p>
        <button class="btn-block" type="submit">Lưu thông tin</button>
      </form>

      <div class="acc-qr">
        <div class="acc-qr-head">
          <span class="acc-qr-label">Ảnh mã QR nhận tiền <small>(không bắt buộc)</small></span>
        </div>
        <p class="acc-hint">${
          u.qr_updated
            ? "Trang Đơn hàng và bill đang dùng ảnh này. Khách cần tự nhập số tiền khi quét."
            : "Tải ảnh QR lấy từ app ngân hàng lên thì trang Đơn hàng và bill sẽ dùng ảnh đó (nên cắt ảnh sát quanh mã QR cho dễ quét). Không tải thì mã QR tự tạo từ số tài khoản, có điền sẵn số tiền."
        }</p>
        ${u.qr_updated && qrObjectUrl ? `<img class="acc-qr-img" src="${qrObjectUrl}" alt="Ảnh mã QR của bạn" />` : ""}
        <div class="acc-qr-actions">
          <label class="btn-sm btn-file">
            ${u.qr_updated ? "Đổi ảnh" : "Chọn ảnh QR"}
            <input type="file" id="qr-file" accept="image/png,image/jpeg,image/webp,image/heic,image/*" />
          </label>
          ${u.qr_updated ? `<button class="btn-sm danger" id="qr-del" type="button">Xoá ảnh</button>` : ""}
        </div>
        <p class="acc-msg" id="qr-msg"></p>
      </div>
    </div>

    <div class="acc-card">
      <h2 class="acc-title">Đổi mật khẩu</h2>
      <form id="password-form" class="acc-form">
        ${field("Mật khẩu hiện tại", `name="current" type="password" autocomplete="current-password" required`)}
        ${field("Mật khẩu mới", `name="next" type="password" autocomplete="new-password" minlength="6" required`)}
        ${field("Nhập lại mật khẩu mới", `name="next2" type="password" autocomplete="new-password" minlength="6" required`)}
        <p class="acc-msg" data-msg></p>
        <button class="btn-block" type="submit">Đổi mật khẩu</button>
      </form>
    </div>

    ${
      admin
        ? `<div class="acc-card">
      <h2 class="acc-title">Quản lý tài khoản</h2>
      <p class="acc-hint">Người mới tự đăng ký trên web, hiện ở đầu danh sách với nhãn "Chờ duyệt".</p>
      <div id="user-list" class="user-list"><p class="acc-hint">Đang tải...</p></div>
    </div>`
        : ""
    }`;

  const toggle = $("#toggle-npp");
  if (toggle)
    toggle.addEventListener("change", (e) => {
      try { localStorage.setItem("showNpp", e.target.checked ? "1" : "0"); } catch {}
      applyNpp();
    });

  $("#logout-btn").addEventListener("click", async () => {
    await sb.auth.signOut().catch(() => {});
    await applyProfile(null);
  });

  const recheck = $("#recheck-btn");
  if (recheck) recheck.addEventListener("click", () => loadProfile());

  onSubmit($("#profile-form"), async (v) => {
    const bin = String(v.bank_bin || "");
    const account = String(v.bank_account || "").replace(/\s/g, "");
    if (bin && !/^\d{6}$/.test(bin)) throw new Error("Ngân hàng không hợp lệ");
    if (account && !/^[0-9A-Za-z]{4,19}$/.test(account)) throw new Error("Số tài khoản không hợp lệ");
    if ((bin || account) && !(bin && account)) throw new Error("Cần chọn ngân hàng và nhập số tài khoản");
    const p = await q(
      sb.from("profiles")
        .update({ name: cleanText(v.name, 60), bank_bin: bin, bank_account: account, bank_holder: cleanText(v.bank_holder, 50) })
        .eq("id", profile.id)
        .select()
        .single()
    );
    await applyProfile(p);
    flash($("#profile-form"), "Đã lưu ✓", true);
  });

  const qrMsg = (text, ok = false) => {
    const m = $("#qr-msg");
    if (!m) return;
    m.textContent = text;
    m.classList.toggle("ok", ok);
  };
  $("#qr-file").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    qrMsg("Đang tải ảnh lên...", true);
    try {
      const dataUrl = await shrinkImage(file);
      const blob = await (await fetch(dataUrl)).blob();
      await q(sb.storage.from("qr").upload(qrPath(profile.id), blob, { upsert: true, contentType: blob.type, cacheControl: "0" }));
      const p = await q(sb.from("profiles").update({ qr_updated: Date.now() }).eq("id", profile.id).select().single());
      await applyProfile(p);
      qrMsg("Đã lưu ảnh QR ✓", true);
    } catch (err) {
      qrMsg(err.message);
    }
  });
  const qrDel = $("#qr-del");
  if (qrDel)
    qrDel.addEventListener("click", async () => {
      if (!confirm("Xoá ảnh QR? Trang Đơn hàng sẽ quay về mã QR tự tạo từ số tài khoản.")) return;
      try {
        await q(sb.storage.from("qr").remove([qrPath(profile.id)]));
        const p = await q(sb.from("profiles").update({ qr_updated: null }).eq("id", profile.id).select().single());
        await applyProfile(p);
      } catch (err) {
        qrMsg(err.message);
      }
    });

  onSubmit($("#password-form"), async (v) => {
    if (v.next !== v.next2) throw new Error("Hai lần nhập mật khẩu mới không khớp");
    if (String(v.next).length < 6) throw new Error("Mật khẩu cần từ 6 ký tự");
    // Kiểm tra mật khẩu hiện tại bằng cách đăng nhập lại
    try {
      await q(sb.auth.signInWithPassword({ email: phoneEmail(profile.phone), password: v.current }));
    } catch {
      throw new Error("Mật khẩu hiện tại không đúng");
    }
    await q(sb.auth.updateUser({ password: v.next }));
    await sb.auth.signOut({ scope: "others" }).catch(() => {});
    $("#password-form").reset();
    flash($("#password-form"), "Đã đổi mật khẩu. Các máy khác đã bị đăng xuất.", true);
  });

  if (active) loadOrderHistory();
  if (admin) loadUsers();
}

/* ----- Thu nhỏ ảnh QR trước khi gửi -----
   Cạnh dài tối đa 1000px, nền trắng (ảnh PNG trong suốt), mã hoá lại thành PNG
   (giữ nét cho mã QR); quá lớn thì chuyển JPEG. Mã hoá lại cũng bỏ luôn thông tin EXIF/vị trí. */
const QR_LIMIT = 550 * 1024; // Storage nhận tối đa 600KB
const dataUrlBytes = (u) => Math.floor(((u.length - u.indexOf(",") - 1) * 3) / 4);

function readImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); resolve(im); };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Không đọc được ảnh. Hãy chọn ảnh PNG hoặc JPG.")); };
    im.src = url;
  });
}

async function shrinkImage(file) {
  if (!/^image\//.test(file.type || "image/")) throw new Error("Hãy chọn một file ảnh");
  const im = await readImage(file);
  for (const max of [1000, 800, 600]) {
    const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(im.naturalWidth * k));
    c.height = Math.max(1, Math.round(im.naturalHeight * k));
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(im, 0, 0, c.width, c.height);
    for (const [type, qv] of [["image/png"], ["image/jpeg", 0.92], ["image/jpeg", 0.85]]) {
      const url = c.toDataURL(type, qv);
      if (url.startsWith("data:" + type) && dataUrlBytes(url) <= QR_LIMIT) return url;
    }
  }
  throw new Error("Ảnh quá lớn, hãy chụp màn hình mã QR rồi tải ảnh đó lên");
}

/* ----- Lưu đơn hàng (chỉ tài khoản đã duyệt) ----- */
function renderSaveOrder() {
  const btn = $("#save-order");
  const panel = $("#save-order-panel");
  if (!btn || !panel) return;
  const can = isActive() && order.size > 0;
  btn.hidden = !can;
  if (!can) panel.hidden = true;
}

function initSaveOrder() {
  const btn = $("#save-order");
  const panel = $("#save-order-panel");
  const form = $("#save-order-form");
  if (!btn || !panel || !form) return;
  btn.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    if (!panel.hidden) $("input[name=customer_name]", form).focus();
  });
  $("#save-order-cancel").addEventListener("click", () => (panel.hidden = true));
  onSubmit(form, async (v) => {
    if (!order.size) throw new Error("Đơn hàng đang trống");
    const snap = orderSnapshot();
    await q(
      sb.from("orders").insert({
        customer_name: cleanText(v.customer_name, 80),
        customer_phone: String(v.customer_phone || "").replace(/[^\d+]/g, "").slice(0, 20),
        note: cleanText(v.note, 300),
        items: snap.items,
        total: snap.total,
        total_pv: snap.totalPv,
        total_bv: snap.totalBv,
        npp: showNpp,
      })
    );
    form.reset();
    flash(form, "Đã lưu đơn ✓ Xem lại trong tab Tài khoản.", true);
    setTimeout(() => {
      panel.hidden = true;
      flash(form, "");
    }, 1800);
    loadOrderHistory();
  });
}

// Hook để app.js báo khi đơn thay đổi (ẩn/hiện nút Lưu đơn)
window.onOrderChange = renderSaveOrder;

let historyRows = [];

async function loadOrderHistory() {
  const box = $("#order-history");
  if (!box) return;
  try {
    historyRows = await q(
      sb.from("orders")
        .select("id, customer_name, customer_phone, note, items, total, npp, created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    );
  } catch (err) {
    box.innerHTML = `<p class="acc-msg">${esc(err.message)}</p>`;
    return;
  }
  if (!historyRows.length) {
    box.innerHTML = `<p class="acc-hint">Chưa có đơn nào. Ở trang Đơn hàng, bấm "Lưu đơn" để lưu lại.</p>`;
    return;
  }
  box.innerHTML = historyRows
    .map((o) => {
      const count = (o.items || []).reduce((a, it) => a + (it.qty || 0), 0);
      const who = o.customer_name || "(không ghi tên khách)";
      return `
      <div class="history-row">
        <div class="history-main">
          <div><b>${esc(who)}</b>${o.customer_phone ? ` <span class="acc-sub">· ${esc(o.customer_phone)}</span>` : ""}</div>
          <div class="acc-sub">${fmtDate(o.created_at)} · ${count} sản phẩm · <b class="history-total">${fmt(Number(o.total) || 0)}</b></div>
          ${o.note ? `<div class="acc-sub">${esc(o.note)}</div>` : ""}
        </div>
        <div class="user-actions">
          <button class="btn-sm" data-order-open="${o.id}" type="button">Mở lại</button>
          <button class="btn-sm danger" data-order-del="${o.id}" type="button">Xoá</button>
        </div>
      </div>`;
    })
    .join("");
}

accView.addEventListener("click", async (e) => {
  const open = e.target.closest("[data-order-open]");
  const del = e.target.closest("[data-order-del]");
  if (open) {
    const o = historyRows.find((r) => String(r.id) === open.dataset.orderOpen);
    if (!o) return;
    if (order.size && !confirm("Mở lại đơn này và thay đơn hiện tại?")) return;
    const missing = loadOrderItems(o.items || []);
    if (missing) alert(`${missing} sản phẩm trong đơn này không còn trong danh sách nên không mở lại được.`);
  } else if (del) {
    if (!confirm("Xoá đơn đã lưu này? Không khôi phục được.")) return;
    try {
      await q(sb.from("orders").delete().eq("id", del.dataset.orderDel));
      loadOrderHistory();
    } catch (err) {
      alert(err.message);
    }
  }
});

/* ----- Quản trị: duyệt, khoá, đặt lại mật khẩu, xoá ----- */
const STATUS_TAG = {
  pending: `<span class="tag tag-wait">Chờ duyệt</span>`,
  disabled: `<span class="tag tag-lock">Đã khoá</span>`,
  active: "",
};

async function loadUsers() {
  const box = $("#user-list");
  if (!box) return;
  let users;
  try {
    users = await q(sb.from("profiles").select("*").order("created_at", { ascending: false }));
  } catch (err) {
    box.innerHTML = `<p class="acc-msg">${esc(err.message)}</p>`;
    return;
  }
  const rank = { pending: 0, active: 1, disabled: 2 };
  users.sort((a, b) => rank[a.status] - rank[b.status]);
  box.innerHTML = users
    .map((u) => {
      const self = u.id === profile.id;
      const tags = (u.role === "admin" ? `<span class="tag tag-admin">Admin</span>` : "") + (STATUS_TAG[u.status] || "");
      const bank = u.bank_account ? `${esc(bankName(u.bank_bin) || u.bank_bin)} · ${esc(u.bank_account)}` : "Chưa có TK nhận tiền";
      let actions;
      if (self) actions = `<span class="acc-sub">(bạn)</span>`;
      else if (u.status === "pending")
        actions = `<button class="btn-sm btn-ok" data-act="approve" data-id="${u.id}">Duyệt</button>
           <button class="btn-sm danger" data-act="delete" data-id="${u.id}">Từ chối</button>`;
      else
        actions = `<button class="btn-sm" data-act="reset" data-id="${u.id}">Đặt lại MK</button>
           <button class="btn-sm" data-act="${u.status === "disabled" ? "unlock" : "lock"}" data-id="${u.id}">${u.status === "disabled" ? "Mở khoá" : "Khoá"}</button>
           <button class="btn-sm danger" data-act="delete" data-id="${u.id}">Xoá</button>`;
      return `
      <div class="user-row">
        <div class="user-main">
          <div><b>${esc(u.name || "(chưa đặt tên)")}</b> ${tags}</div>
          <div class="acc-sub">${esc(u.phone)} · ${bank}</div>
          <div class="acc-sub">Đăng ký ${fmtDate(u.created_at)}</div>
        </div>
        <div class="user-actions">${actions}</div>
      </div>`;
    })
    .join("");
}

// Đặt lại mật khẩu và xoá tài khoản cần quyền cao hơn: gọi hàm máy chủ api/admin trên Vercel
async function adminApi(body) {
  const { data } = await sb.auth.getSession();
  const token = data && data.session && data.session.access_token;
  if (!token) throw new Error("Phiên đăng nhập đã hết, vui lòng đăng nhập lại");
  let r;
  try {
    r = await fetch("/api/admin", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Không kết nối được máy chủ");
  }
  const out = await r.json().catch(() => null);
  if (!r.ok) throw new Error((out && out.error) || "Có lỗi xảy ra");
  return out;
}

accView.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  const row = btn.closest(".user-row");
  const who = row ? $(".acc-sub", row).textContent.split(" · ")[0] : "";
  const setStatus = (status) => q(sb.from("profiles").update({ status }).eq("id", id));
  try {
    if (btn.dataset.act === "approve") {
      await setStatus("active");
    } else if (btn.dataset.act === "reset") {
      const pw = prompt(`Mật khẩu mới cho ${who} (từ 6 ký tự):`);
      if (!pw) return;
      if (pw.length < 6) throw new Error("Mật khẩu cần từ 6 ký tự");
      await adminApi({ action: "reset_password", id, password: pw });
      alert(`Đã đặt lại mật khẩu cho ${who}.`);
    } else if (btn.dataset.act === "lock") {
      if (!confirm(`Khoá tài khoản ${who}? Người này sẽ không dùng được nữa.`)) return;
      await setStatus("disabled");
    } else if (btn.dataset.act === "unlock") {
      await setStatus("active");
    } else if (btn.dataset.act === "delete") {
      if (!confirm(`Xoá hẳn tài khoản ${who} cùng các đơn đã lưu? Không khôi phục được.`)) return;
      await adminApi({ action: "delete_user", id });
    }
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
});

/* ----- Khởi động ----- */
(async function initAccount() {
  if (!sb) return; // chưa cấu hình Supabase: chạy như bản tĩnh
  $("#tab-account").hidden = false;
  initSaveOrder();
  sb.auth.onAuthStateChange((event) => {
    // Phiên hết hạn hoặc đăng xuất ở tab khác
    if (event === "SIGNED_OUT" && profile) applyProfile(null);
  });
  renderAccount(); // hiện trang đăng nhập ngay, cập nhật khi nạp xong hồ sơ
  await loadProfile();
})();
