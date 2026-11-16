// Mật khẩu (scrypt) và phiên đăng nhập (cookie HttpOnly)
const crypto = require("crypto");
const { get, run } = require("./db");

const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1 };

// Chuẩn hoá Unicode (NFC): cùng một chữ có dấu có thể đến dưới hai dạng mã khác nhau
// tuỳ bàn phím/thiết bị; không chuẩn hoá thì mật khẩu đúng vẫn bị báo sai.
const normPw = (s) => String(s).normalize("NFC");

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(normPw(password), salt, 64, SCRYPT);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

function verifyPassword(password, stored) {
  const [alg, salt, key] = String(stored).split("$");
  if (alg !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = crypto.scryptSync(normPw(password), Buffer.from(salt, "base64"), expected.length, SCRYPT);
  return crypto.timingSafeEqual(expected, actual);
}

// Dùng khi SĐT không tồn tại, để thời gian phản hồi giống khi sai mật khẩu
const DUMMY_HASH = hashPassword(crypto.randomBytes(12).toString("hex"));

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setSessionCookie(req, res, token, maxAgeSec) {
  const parts = [`sid=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSec}`];
  if (req.secure) parts.push("Secure");
  res.append("Set-Cookie", parts.join("; "));
}

function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  run("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)", sha256(token), userId, Date.now() + SESSION_DAYS * 864e5);
  setSessionCookie(req, res, token, SESSION_DAYS * 86400);
}

function endSession(req, res) {
  const token = parseCookies(req.headers.cookie).sid;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", sha256(token));
  setSessionCookie(req, res, "", 0);
}

function userFromRequest(req) {
  const token = parseCookies(req.headers.cookie).sid;
  if (!token) return null;
  const row = get(
    "SELECT u.*, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?",
    sha256(token)
  );
  if (!row || row.expires_at < Date.now() || row.disabled) return null;
  return row;
}

// Đăng xuất mọi thiết bị của một người (khi đổi/đặt lại mật khẩu hoặc khoá tài khoản)
const endAllSessions = (userId) => run("DELETE FROM sessions WHERE user_id = ?", userId);
const purgeExpiredSessions = () => run("DELETE FROM sessions WHERE expires_at < ?", Date.now());

module.exports = {
  hashPassword, verifyPassword, DUMMY_HASH,
  startSession, endSession, userFromRequest, endAllSessions, purgeExpiredSessions,
};
