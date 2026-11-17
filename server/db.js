// Cơ sở dữ liệu SQLite (dùng node:sqlite có sẵn trong Node, không cần thư viện ngoài)
const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const KEEP_BACKUPS = 14;

fs.mkdirSync(BACKUP_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, "app.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY,
    phone         TEXT UNIQUE NOT NULL,
    name          TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',   -- 'user' | 'admin'
    disabled      INTEGER NOT NULL DEFAULT 0,
    bank_bin      TEXT NOT NULL DEFAULT '',
    bank_account  TEXT NOT NULL DEFAULT '',
    bank_holder   TEXT NOT NULL DEFAULT '',
    created_at    INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  -- Ảnh mã QR nhận tiền do người dùng tải lên (bảng riêng, không đụng bảng users).
  -- Nằm trong app.db nên có trong bản sao lưu; xoá tài khoản thì ảnh tự xoá theo.
  CREATE TABLE IF NOT EXISTS user_qr (
    user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    mime       TEXT NOT NULL,
    data       BLOB NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

const get = (sql, ...args) => db.prepare(sql).get(...args);
const all = (sql, ...args) => db.prepare(sql).all(...args);
const run = (sql, ...args) => db.prepare(sql).run(...args);

// Sao lưu: mỗi ngày một bản trong data/backups, giữ 14 bản gần nhất
function backupIfNeeded() {
  const day = new Date().toISOString().slice(0, 10);
  const file = path.join(BACKUP_DIR, `app-${day}.db`);
  if (fs.existsSync(file)) return;
  db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
  const old = fs.readdirSync(BACKUP_DIR).filter((f) => /^app-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort();
  old.slice(0, Math.max(0, old.length - KEEP_BACKUPS)).forEach((f) => fs.unlinkSync(path.join(BACKUP_DIR, f)));
}

module.exports = { db, get, all, run, backupIfNeeded, DATA_DIR };
