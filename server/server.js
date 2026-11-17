// Server cho huy-abo: phục vụ trang web tĩnh + API đăng nhập / tài khoản / quản trị
const path = require("path");
const express = require("express");
const { get, all, run, backupIfNeeded } = require("./db");
const auth = require("./auth");

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = process.env.PUBLIC_DIR || path.join(__dirname, "..", "public");

/* ===================== Kiểm tra dữ liệu ===================== */
// Chuẩn hoá SĐT: bỏ ký tự không phải số, +84/84 -> 0
function normPhone(s) {
  let d = String(s || "").replace(/\D/g, "");
  if (d.startsWith("84") && d.length === 11) d = "0" + d.slice(2);
  return /^0\d{9,10}$/.test(d) ? d : null;
}
const validPassword = (s) => typeof s === "string" && s.length >= 6 && s.length <= 72;
const cleanText = (s, max) => String(s || "").trim().replace(/\s+/g, " ").slice(0, max);

function publicUser(u) {
  const qr = get("SELECT updated_at FROM user_qr WHERE user_id = ?", u.id);
  return {
    id: u.id, phone: u.phone, name: u.name, role: u.role, disabled: !!u.disabled,
    bank_bin: u.bank_bin, bank_account: u.bank_account, bank_holder: u.bank_holder,
    qr_updated: qr ? qr.updated_at : 0, // 0 = chưa tải ảnh QR; khác 0 dùng làm ?v= khi tải ảnh
    created_at: u.created_at,
  };
}

// Ảnh QR tải lên: trình duyệt đã thu nhỏ và mã hoá lại thành PNG/JPEG trước khi gửi
const QR_MAX_BYTES = 600 * 1024;
function parseQrImage(dataUrl) {
  const m = /^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ""));
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > QR_MAX_BYTES) return null;
  const isPng = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if ((m[1] === "image/png" && !isPng) || (m[1] === "image/jpeg" && !isJpeg)) return null;
  return { mime: m[1], data: buf };
}

/* ===================== Chống dò mật khẩu ===================== */
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map(); // key -> { count, first }
function tooManyFailures(key, limit) {
  const f = failures.get(key);
  if (!f) return false;
  if (Date.now() - f.first > WINDOW_MS) { failures.delete(key); return false; }
  return f.count >= limit;
}
function recordFailure(key) {
  const f = failures.get(key);
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else f.count++;
}

/* ===================== Ứng dụng ===================== */
const app = express();
app.set("trust proxy", 1); // chạy sau Caddy/Nginx: lấy đúng IP và https
app.disable("x-powered-by");

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "same-origin");
  res.set("X-Frame-Options", "DENY");
  next();
});

app.use("/api/me/qr", express.json({ limit: "900kb" })); // ảnh QR (base64), đặt trước giới hạn chung
app.use("/api", express.json({ limit: "20kb" }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "HEAD") {
    // Chỉ nhận yêu cầu gửi từ chính trang web này
    const origin = req.get("origin");
    if (origin) {
      let ok = false;
      try { ok = new URL(origin).host === req.get("host"); } catch {}
      if (!ok) return res.status(403).json({ error: "Yêu cầu không hợp lệ" });
    }
    if (!req.is("application/json")) return res.status(415).json({ error: "Yêu cầu không hợp lệ" });
  }
  req.user = auth.userFromRequest(req);
  next();
});

const requireUser = (req, res, next) => (req.user ? next() : res.status(401).json({ error: "Chưa đăng nhập" }));
const requireAdmin = (req, res, next) =>
  req.user && req.user.role === "admin" ? next() : res.status(403).json({ error: "Không có quyền" });

app.get("/api/health", (req, res) => res.json({ ok: true }));

/* ----- Đăng nhập / đăng xuất ----- */
app.post("/api/login", (req, res) => {
  const phone = normPhone(req.body.phone);
  const password = req.body.password;
  const ipKey = "ip:" + req.ip;
  const phoneKey = "phone:" + phone;
  if (tooManyFailures(ipKey, 20) || (phone && tooManyFailures(phoneKey, 8))) {
    return res.status(429).json({ error: "Sai quá nhiều lần. Vui lòng thử lại sau 15 phút." });
  }
  const user = phone ? get("SELECT * FROM users WHERE phone = ?", phone) : null;
  const ok = auth.verifyPassword(String(password || ""), user ? user.password_hash : auth.DUMMY_HASH);
  if (!user || !ok) {
    recordFailure(ipKey);
    if (phone) recordFailure(phoneKey);
    return res.status(401).json({ error: "Sai số điện thoại hoặc mật khẩu" });
  }
  if (user.disabled) return res.status(403).json({ error: "Tài khoản đã bị khoá. Liên hệ quản trị viên." });
  failures.delete(phoneKey);
  auth.startSession(req, res, user.id);
  res.json({ user: publicUser(user) });
});

app.post("/api/logout", (req, res) => {
  auth.endSession(req, res);
  res.json({ ok: true });
});

/* ----- Tài khoản của tôi ----- */
app.get("/api/me", requireUser, (req, res) => res.json({ user: publicUser(req.user) }));

app.put("/api/me/profile", requireUser, (req, res) => {
  const name = cleanText(req.body.name, 60);
  const bin = String(req.body.bank_bin || "");
  const account = String(req.body.bank_account || "").replace(/\s/g, "");
  const holder = cleanText(req.body.bank_holder, 50);
  if (bin && !/^\d{6}$/.test(bin)) return res.status(400).json({ error: "Ngân hàng không hợp lệ" });
  if (account && !/^[0-9A-Za-z]{4,19}$/.test(account)) return res.status(400).json({ error: "Số tài khoản không hợp lệ" });
  if ((bin || account) && !(bin && account)) return res.status(400).json({ error: "Cần chọn ngân hàng và nhập số tài khoản" });
  run("UPDATE users SET name = ?, bank_bin = ?, bank_account = ?, bank_holder = ? WHERE id = ?", name, bin, account, holder, req.user.id);
  res.json({ user: publicUser(get("SELECT * FROM users WHERE id = ?", req.user.id)) });
});

// Ảnh mã QR nhận tiền của chính mình
app.get("/api/me/qr", requireUser, (req, res) => {
  const qr = get("SELECT mime, data FROM user_qr WHERE user_id = ?", req.user.id);
  if (!qr) return res.status(404).json({ error: "Chưa có ảnh QR" });
  res.set("Content-Type", qr.mime);
  res.set("Cache-Control", "private, max-age=31536000, immutable"); // đổi ảnh thì đổi ?v=
  res.send(Buffer.from(qr.data));
});

app.put("/api/me/qr", requireUser, (req, res) => {
  const img = parseQrImage(req.body.image);
  if (!img) return res.status(400).json({ error: "Ảnh không hợp lệ hoặc quá lớn" });
  run(
    `INSERT INTO user_qr (user_id, mime, data, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET mime = excluded.mime, data = excluded.data, updated_at = excluded.updated_at`,
    req.user.id, img.mime, img.data, Date.now()
  );
  res.json({ user: publicUser(req.user) });
});

app.delete("/api/me/qr", requireUser, (req, res) => {
  run("DELETE FROM user_qr WHERE user_id = ?", req.user.id);
  res.json({ user: publicUser(req.user) });
});

app.put("/api/me/password", requireUser, (req, res) => {
  const { current, next } = req.body;
  if (!auth.verifyPassword(String(current || ""), req.user.password_hash)) return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
  if (!validPassword(next)) return res.status(400).json({ error: "Mật khẩu mới phải từ 6 ký tự" });
  run("UPDATE users SET password_hash = ? WHERE id = ?", auth.hashPassword(next), req.user.id);
  auth.endAllSessions(req.user.id);
  auth.startSession(req, res, req.user.id); // giữ đăng nhập trên máy đang dùng
  res.json({ ok: true });
});

/* ----- Quản trị ----- */
app.get("/api/admin/users", requireAdmin, (req, res) => {
  res.json({ users: all("SELECT * FROM users ORDER BY created_at DESC").map(publicUser) });
});

app.post("/api/admin/users", requireAdmin, (req, res) => {
  const phone = normPhone(req.body.phone);
  const name = cleanText(req.body.name, 60);
  if (!phone) return res.status(400).json({ error: "Số điện thoại không hợp lệ" });
  if (!validPassword(req.body.password)) return res.status(400).json({ error: "Mật khẩu phải từ 6 ký tự" });
  if (get("SELECT id FROM users WHERE phone = ?", phone)) return res.status(409).json({ error: "Số điện thoại đã có tài khoản" });
  const r = run(
    "INSERT INTO users (phone, name, password_hash, created_at) VALUES (?, ?, ?, ?)",
    phone, name, auth.hashPassword(req.body.password), Date.now()
  );
  res.status(201).json({ user: publicUser(get("SELECT * FROM users WHERE id = ?", r.lastInsertRowid)) });
});

app.patch("/api/admin/users/:id", requireAdmin, (req, res) => {
  const target = get("SELECT * FROM users WHERE id = ?", Number(req.params.id));
  if (!target) return res.status(404).json({ error: "Không tìm thấy tài khoản" });
  const isSelf = target.id === req.user.id;
  const { name, password, disabled, role } = req.body;
  if (password !== undefined && !validPassword(password)) return res.status(400).json({ error: "Mật khẩu phải từ 6 ký tự" });
  if (disabled !== undefined && isSelf) return res.status(400).json({ error: "Không thể tự khoá tài khoản của mình" });
  if (role !== undefined && isSelf) return res.status(400).json({ error: "Không thể tự đổi quyền của mình" });
  if (role !== undefined && role !== "user" && role !== "admin") return res.status(400).json({ error: "Quyền không hợp lệ" });

  if (name !== undefined) run("UPDATE users SET name = ? WHERE id = ?", cleanText(name, 60), target.id);
  if (role !== undefined) run("UPDATE users SET role = ? WHERE id = ?", role, target.id);
  if (password !== undefined) {
    run("UPDATE users SET password_hash = ? WHERE id = ?", auth.hashPassword(password), target.id);
    auth.endAllSessions(target.id);
  }
  if (disabled !== undefined) {
    run("UPDATE users SET disabled = ? WHERE id = ?", disabled ? 1 : 0, target.id);
    if (disabled) auth.endAllSessions(target.id);
  }
  res.json({ user: publicUser(get("SELECT * FROM users WHERE id = ?", target.id)) });
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ error: "Không thể xoá tài khoản của mình" });
  const r = run("DELETE FROM users WHERE id = ?", id);
  if (!r.changes) return res.status(404).json({ error: "Không tìm thấy tài khoản" });
  res.json({ ok: true });
});

app.use("/api", (req, res) => res.status(404).json({ error: "Không tìm thấy" }));

/* ----- Trang web tĩnh ----- */
app.use(
  express.static(PUBLIC_DIR, {
    dotfiles: "ignore",
    setHeaders: (res) => res.set("Cache-Control", "public, max-age=0, must-revalidate"),
  })
);

/* ----- Lỗi không lường trước ----- */
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Yêu cầu không hợp lệ" });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Dữ liệu quá lớn (ảnh tối đa khoảng 600KB)" });
  console.error(err);
  res.status(500).json({ error: "Lỗi máy chủ" });
});

/* ===================== Khởi động ===================== */
function housekeeping() {
  try { backupIfNeeded(); } catch (e) { console.error("Sao lưu lỗi:", e.message); }
  auth.purgeExpiredSessions();
}
housekeeping();
setInterval(housekeeping, 60 * 60 * 1000); // mỗi giờ kiểm tra, mỗi ngày tạo 1 bản sao lưu

app.listen(PORT, () => console.log(`huy-abo chạy tại cổng ${PORT}, web: ${PUBLIC_DIR}`));
