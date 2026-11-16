// Tạo (hoặc cấp lại) tài khoản admin. Chạy trên VPS:
//   docker compose exec app npm --prefix server run create-admin --silent
// Nếu SĐT đã có tài khoản: nâng quyền admin, đặt lại mật khẩu, mở khoá.
const readline = require("readline");
const { Writable } = require("stream");
const { get, run } = require("./db");
const { hashPassword, endAllSessions } = require("./auth");

// Một readline dùng cho mọi câu hỏi. Khi nhập mật khẩu thì tắt hẳn phần hiện chữ
// (kể cả lúc bấm xoá lùi, readline vẽ lại cả dòng), nên mật khẩu không bao giờ lộ ra màn hình.
let muted = false;
const output = new Writable({
  write(chunk, enc, cb) {
    if (!muted) process.stdout.write(chunk, enc);
    cb();
  },
});
const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
rl.on("SIGINT", () => {
  process.stdout.write("\nĐã huỷ.\n");
  process.exit(130);
});

const ask = (question) => new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));

function askHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    muted = true;
    rl.question("", (answer) => {
      muted = false;
      process.stdout.write("\n");
      resolve(answer); // không cắt khoảng trắng: trang đăng nhập cũng không cắt
    });
  });
}

// Bộ gõ tiếng Việt (Telex/VNI, Unikey...) tự đổi chữ khi gõ (aa → â, s → dấu sắc) mà màn hình
// không hiện ra, nên hai lần gõ giống nhau vẫn có thể ra mật khẩu khác nhau.
const hasNonAscii = (s) => /[^\x20-\x7e]/.test(s);

async function askPassword() {
  for (let tries = 1; tries <= 3; tries++) {
    const pw = await askHidden("Mật khẩu (từ 6 ký tự, không hiện khi gõ): ");
    if (hasNonAscii(pw)) {
      console.error("Mật khẩu có chữ có dấu: có thể bộ gõ tiếng Việt đang bật. Hãy chuyển bàn phím sang ABC/tiếng Anh rồi nhập lại.");
      continue;
    }
    if (pw.length < 6) {
      console.error("Mật khẩu quá ngắn, cần từ 6 ký tự.");
      continue;
    }
    const pw2 = await askHidden("Nhập lại mật khẩu: ");
    if (pw === pw2) return pw;
    console.error("Hai lần nhập không khớp, nhập lại từ đầu.");
  }
  console.error("Nhập sai quá 3 lần, chưa tạo tài khoản. Chạy lại lệnh để thử tiếp.");
  process.exit(1);
}

(async () => {
  let phone = (await ask("Số điện thoại admin: ")).replace(/\D/g, "");
  if (phone.startsWith("84") && phone.length === 11) phone = "0" + phone.slice(2);
  if (!/^0\d{9,10}$/.test(phone)) {
    console.error("Số điện thoại không hợp lệ.");
    process.exit(1);
  }
  const name = await ask("Tên hiển thị: ");
  const pw = await askPassword();
  rl.close();

  const existing = get("SELECT id FROM users WHERE phone = ?", phone);
  if (existing) {
    run(
      "UPDATE users SET role = 'admin', disabled = 0, password_hash = ?, name = COALESCE(NULLIF(?, ''), name) WHERE id = ?",
      hashPassword(pw), name, existing.id
    );
    endAllSessions(existing.id);
    console.log(`Đã cấp quyền admin và đặt lại mật khẩu cho ${phone}.`);
  } else {
    run(
      "INSERT INTO users (phone, name, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', ?)",
      phone, name, hashPassword(pw), Date.now()
    );
    console.log(`Đã tạo tài khoản admin ${phone}.`);
  }
})();
