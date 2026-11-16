// Tạo (hoặc cấp lại) tài khoản admin. Chạy trên VPS:
//   docker compose exec app npm run create-admin
// Nếu SĐT đã có tài khoản: nâng quyền admin, đặt lại mật khẩu, mở khoá.
const readline = require("readline");
const { get, run } = require("./db");
const { hashPassword, endAllSessions } = require("./auth");

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.includes(question)) rl.output.write(s);
        else if (s !== "\r\n" && s !== "\n") rl.output.write("*");
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

(async () => {
  let phone = (await ask("Số điện thoại admin: ")).replace(/\D/g, "");
  if (phone.startsWith("84") && phone.length === 11) phone = "0" + phone.slice(2);
  if (!/^0\d{9,10}$/.test(phone)) { console.error("Số điện thoại không hợp lệ."); process.exit(1); }
  const name = await ask("Tên hiển thị: ");
  const pw = await ask("Mật khẩu (từ 6 ký tự): ", true);
  if (pw.length < 6) { console.error("Mật khẩu quá ngắn."); process.exit(1); }
  const pw2 = await ask("Nhập lại mật khẩu: ", true);
  if (pw !== pw2) { console.error("Hai lần nhập không khớp."); process.exit(1); }

  const existing = get("SELECT id FROM users WHERE phone = ?", phone);
  if (existing) {
    run("UPDATE users SET role = 'admin', disabled = 0, password_hash = ?, name = COALESCE(NULLIF(?, ''), name) WHERE id = ?",
      hashPassword(pw), name, existing.id);
    endAllSessions(existing.id);
    console.log(`Đã cấp quyền admin và đặt lại mật khẩu cho ${phone}.`);
  } else {
    run("INSERT INTO users (phone, name, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', ?)",
      phone, name, hashPassword(pw), Date.now());
    console.log(`Đã tạo tài khoản admin ${phone}.`);
  }
})();
