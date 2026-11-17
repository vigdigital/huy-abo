/* ============================================================
   TÀI KHOẢN — chỉ hoạt động khi web chạy trên VPS (có /api).
   Trên Vercel không có backend: giữ nguyên hành vi cũ.
   ============================================================ */

let backend = false;
const accView = $("#view-account");

/* ----- Gọi API ----- */
async function api(method, path, body) {
  const opts = { method, credentials: "same-origin", headers: {} };
  if (method !== "GET") {
    opts.headers["content-type"] = "application/json";
    opts.body = JSON.stringify(body || {});
  }
  let r;
  try {
    r = await fetch(path, opts);
  } catch {
    throw new Error("Không kết nối được máy chủ");
  }
  const data = await r.json().catch(() => null);
  if (r.status === 401 && path !== "/api/login" && currentUser) setUser(null); // phiên hết hạn
  if (!r.ok) throw new Error((data && data.error) || "Có lỗi xảy ra");
  return data;
}

/* ----- Giá NPP chỉ dành cho người đã đăng nhập -----
   Công tắc nằm trong tab Tài khoản, không có chữ, để khách đứng xem không biết mà bấm.
   Chưa đăng nhập (và trên Vercel, nơi không có đăng nhập) thì luôn tắt. */
const nppSaved = () => localStorage.getItem("showNpp") === "1";

function setShowNpp(on) {
  if (on === showNpp) return;
  showNpp = on;
  renderProducts();
  renderOrder();
}

function setNppAllowed(allowed) {
  setShowNpp(allowed && nppSaved());
}

function setUser(user) {
  currentUser = user;
  setNppAllowed(!!user);
  renderOrder(); // cập nhật khối thanh toán theo người nhận tiền mới
  renderAccount();
}

/* ----- Giao diện ----- */
const field = (label, attrs) => `<label class="acc-field"><span>${label}</span><input ${attrs} /></label>`;

function flash(form, text, ok = false) {
  const m = $("[data-msg]", form);
  m.textContent = text;
  m.classList.toggle("ok", ok);
}

// Gửi form: khoá nút trong lúc chờ, hiện lỗi nếu có
function onSubmit(form, handler) {
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

function renderAccount() {
  if (!backend) return;
  if (!currentUser) return renderLogin();

  const u = currentUser;
  const isAdmin = u.role === "admin";
  const bankOptions =
    `<option value="">— Chọn ngân hàng —</option>` +
    BANKS.map((b) => `<option value="${b.bin}" ${b.bin === u.bank_bin ? "selected" : ""}>${esc(b.name)}</option>`).join("");

  accView.innerHTML = `
    <div class="acc-card acc-head">
      <div>
        <div class="acc-name">${esc(u.name || u.phone)}</div>
        <div class="acc-sub">${esc(u.phone)}${isAdmin ? " · Quản trị viên" : ""}</div>
      </div>
      <div class="acc-head-actions">
        <label class="npp-toggle">
          <input type="checkbox" id="toggle-npp" aria-label="Chế độ giá" ${showNpp ? "checked" : ""} />
          <span class="npp-track"><span class="npp-thumb"></span></span>
        </label>
        <button id="logout-btn" class="btn-sm" type="button">Đăng xuất</button>
      </div>
    </div>

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
        ${u.qr_updated ? `<img class="acc-qr-img" src="/api/me/qr?v=${u.qr_updated}" alt="Ảnh mã QR của bạn" />` : ""}
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
      isAdmin
        ? `<div class="acc-card">
      <h2 class="acc-title">Quản lý tài khoản</h2>
      <form id="add-user-form" class="acc-form">
        ${field("Số điện thoại", `name="phone" type="tel" inputmode="tel" required`)}
        ${field("Tên", `name="name" maxlength="60"`)}
        ${field("Mật khẩu ban đầu", `name="password" type="text" minlength="6" autocomplete="off" required`)}
        <p class="acc-msg" data-msg></p>
        <button class="btn-block" type="submit">Thêm tài khoản</button>
      </form>
      <div id="user-list" class="user-list"><p class="acc-hint">Đang tải...</p></div>
    </div>`
        : ""
    }`;

  $("#toggle-npp").addEventListener("change", (e) => {
    localStorage.setItem("showNpp", e.target.checked ? "1" : "0");
    setShowNpp(e.target.checked);
  });

  $("#logout-btn").addEventListener("click", async () => {
    await api("POST", "/api/logout").catch(() => {});
    setUser(null);
  });

  onSubmit($("#profile-form"), async (v) => {
    const { user } = await api("PUT", "/api/me/profile", v);
    setUser(user);
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
      const image = await shrinkImage(file);
      const { user } = await api("PUT", "/api/me/qr", { image });
      setUser(user);
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
        const { user } = await api("DELETE", "/api/me/qr");
        setUser(user);
      } catch (err) {
        qrMsg(err.message);
      }
    });

  onSubmit($("#password-form"), async (v) => {
    if (v.next !== v.next2) throw new Error("Hai lần nhập mật khẩu mới không khớp");
    await api("PUT", "/api/me/password", { current: v.current, next: v.next });
    $("#password-form").reset();
    flash($("#password-form"), "Đã đổi mật khẩu. Các máy khác đã bị đăng xuất.", true);
  });

  if (isAdmin) {
    onSubmit($("#add-user-form"), async (v) => {
      await api("POST", "/api/admin/users", v);
      $("#add-user-form").reset();
      flash($("#add-user-form"), `Đã thêm tài khoản ${v.phone}`, true);
      loadUsers();
    });
    loadUsers();
  }
}

/* ----- Thu nhỏ ảnh QR trước khi gửi -----
   Cạnh dài tối đa 1000px, nền trắng (ảnh PNG trong suốt), mã hoá lại thành PNG
   (giữ nét cho mã QR); quá lớn thì chuyển JPEG. Mã hoá lại cũng bỏ luôn thông tin EXIF/vị trí. */
const QR_LIMIT = 550 * 1024; // máy chủ nhận tối đa 600KB
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
    for (const [type, q] of [["image/png"], ["image/jpeg", 0.92], ["image/jpeg", 0.85]]) {
      const url = c.toDataURL(type, q);
      if (url.startsWith("data:" + type) && dataUrlBytes(url) <= QR_LIMIT) return url;
    }
  }
  throw new Error("Ảnh quá lớn, hãy chụp màn hình mã QR rồi tải ảnh đó lên");
}

function renderLogin() {
  accView.innerHTML = `
    <div class="acc-card">
      <h2 class="acc-title">Đăng nhập</h2>
      <p class="acc-hint">Đăng nhập để in bill với tài khoản nhận tiền của bạn.</p>
      <form id="login-form" class="acc-form">
        ${field("Số điện thoại", `name="phone" type="tel" inputmode="tel" autocomplete="username" required`)}
        ${field("Mật khẩu", `name="password" type="password" autocomplete="current-password" required`)}
        <p class="acc-msg" data-msg></p>
        <button class="btn-block" type="submit">Đăng nhập</button>
      </form>
      <p class="acc-hint">Chưa có tài khoản? Liên hệ quản trị viên để được cấp.</p>
    </div>`;
  onSubmit($("#login-form"), async (v) => {
    const { user } = await api("POST", "/api/login", v);
    setUser(user);
  });
}

/* ----- Quản trị: danh sách tài khoản ----- */
async function loadUsers() {
  const box = $("#user-list");
  if (!box) return;
  let users;
  try {
    ({ users } = await api("GET", "/api/admin/users"));
  } catch (err) {
    box.innerHTML = `<p class="acc-msg">${esc(err.message)}</p>`;
    return;
  }
  box.innerHTML = users
    .map((u) => {
      const self = u.id === currentUser.id;
      const tags =
        (u.role === "admin" ? `<span class="tag tag-admin">Admin</span>` : "") +
        (u.disabled ? `<span class="tag tag-lock">Đã khoá</span>` : "");
      const bank = u.bank_account ? `${esc(bankName(u.bank_bin) || u.bank_bin)} · ${esc(u.bank_account)}` : "Chưa có TK nhận tiền";
      const actions = self
        ? `<span class="acc-sub">(bạn)</span>`
        : `<button class="btn-sm" data-act="reset" data-id="${u.id}">Đặt lại MK</button>
           <button class="btn-sm" data-act="${u.disabled ? "unlock" : "lock"}" data-id="${u.id}">${u.disabled ? "Mở khoá" : "Khoá"}</button>
           <button class="btn-sm danger" data-act="delete" data-id="${u.id}">Xoá</button>`;
      return `
      <div class="user-row">
        <div class="user-main">
          <div><b>${esc(u.name || "(chưa đặt tên)")}</b> ${tags}</div>
          <div class="acc-sub">${esc(u.phone)} · ${bank}</div>
        </div>
        <div class="user-actions">${actions}</div>
      </div>`;
    })
    .join("");
}

accView.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  const row = btn.closest(".user-row");
  const who = row ? $(".acc-sub", row).textContent.split(" · ")[0] : "";
  try {
    if (btn.dataset.act === "reset") {
      const pw = prompt(`Mật khẩu mới cho ${who} (từ 6 ký tự):`);
      if (!pw) return;
      await api("PATCH", `/api/admin/users/${id}`, { password: pw });
      alert(`Đã đặt lại mật khẩu cho ${who}.`);
    } else if (btn.dataset.act === "lock") {
      if (!confirm(`Khoá tài khoản ${who}? Người này sẽ bị đăng xuất ngay.`)) return;
      await api("PATCH", `/api/admin/users/${id}`, { disabled: true });
    } else if (btn.dataset.act === "unlock") {
      await api("PATCH", `/api/admin/users/${id}`, { disabled: false });
    } else if (btn.dataset.act === "delete") {
      if (!confirm(`Xoá hẳn tài khoản ${who}? Không khôi phục được.`)) return;
      await api("DELETE", `/api/admin/users/${id}`);
    }
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
});

/* ----- Khởi động: dò backend ----- */
(async function initAccount() {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 4000);
    const r = await fetch("/api/health", { signal: ctl.signal, cache: "no-store" });
    clearTimeout(timer);
    backend = r.ok && (await r.json()).ok === true;
  } catch {
    backend = false;
  }
  if (!backend) return; // Vercel: không có đăng nhập nên không có giá NPP
  $("#tab-account").hidden = false;
  try {
    const { user } = await api("GET", "/api/me");
    setUser(user);
  } catch {
    setUser(null);
  }
})();
