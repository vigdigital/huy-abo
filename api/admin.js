// Hàm máy chủ trên Vercel: việc quản trị cần quyền cao (đặt lại mật khẩu, xoá tài khoản).
// Cần 2 biến môi trường trong Vercel > Settings > Environment Variables:
//   SUPABASE_URL               (giống config.js)
//   SUPABASE_SERVICE_ROLE_KEY  (key bí mật, KHÔNG đưa vào code web)
// Chỉ admin đang hoạt động mới gọi được: kiểm tra token đăng nhập của người gọi.

const URL_BASE = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const svc = (path, opts = {}) =>
  fetch(URL_BASE + path, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": "application/json",
      ...(opts.headers || {}),
    },
  });

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

module.exports = async (req, res) => {
  const send = (status, obj) => res.status(status).json(obj);
  if (req.method !== "POST") return send(405, { error: "Phương thức không hợp lệ" });
  if (!URL_BASE || !SERVICE_KEY) return send(500, { error: "Máy chủ chưa được cấu hình (thiếu biến môi trường Supabase)" });

  // 1. Xác minh người gọi
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return send(401, { error: "Chưa đăng nhập" });
  const who = await fetch(URL_BASE + "/auth/v1/user", {
    headers: { apikey: SERVICE_KEY, authorization: `Bearer ${token}` },
  });
  if (!who.ok) return send(401, { error: "Phiên đăng nhập đã hết, vui lòng đăng nhập lại" });
  const caller = await who.json();

  const pr = await svc(`/rest/v1/profiles?id=eq.${caller.id}&select=role,status`);
  const [me] = pr.ok ? await pr.json() : [];
  if (!me || me.role !== "admin" || me.status !== "active") return send(403, { error: "Chỉ quản trị viên được làm việc này" });

  // 2. Thực hiện
  let body;
  try {
    body = await readBody(req);
  } catch {
    return send(400, { error: "Dữ liệu không hợp lệ" });
  }
  const { action, id, password } = body || {};
  if (!UUID.test(String(id || ""))) return send(400, { error: "Tài khoản không hợp lệ" });
  if (id === caller.id) return send(400, { error: "Không tự thao tác trên tài khoản của mình ở đây" });

  if (action === "reset_password") {
    if (typeof password !== "string" || password.length < 6 || password.length > 72)
      return send(400, { error: "Mật khẩu cần từ 6 đến 72 ký tự" });
    const r = await svc(`/auth/v1/admin/users/${id}`, { method: "PUT", body: JSON.stringify({ password }) });
    if (!r.ok) return send(502, { error: "Không đặt lại được mật khẩu" });
    return send(200, { ok: true });
  }

  if (action === "delete_user") {
    // Xoá ảnh QR trước (Storage không tự xoá theo tài khoản)
    await svc(`/storage/v1/object/qr`, { method: "DELETE", body: JSON.stringify({ prefixes: [`${id}/qr`] }) }).catch(() => {});
    const r = await svc(`/auth/v1/admin/users/${id}`, { method: "DELETE" });
    if (!r.ok) return send(502, { error: "Không xoá được tài khoản" });
    return send(200, { ok: true }); // hồ sơ và đơn hàng tự xoá theo (on delete cascade)
  }

  return send(400, { error: "Việc không hợp lệ" });
};
