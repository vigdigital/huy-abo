/* ============================================================
   VietQR (chuẩn NAPAS / EMVCo) — tạo chuỗi dữ liệu cho mã QR chuyển khoản.
   Cấu trúc đã đối chiếu với mã QR do ACB cấp.
   ============================================================ */

// Mã BIN ngân hàng (NAPAS). Kiểm tra bằng app ngân hàng trước khi dùng thật.
const BANKS = [
  { bin: "970416", name: "ACB" },
  { bin: "970436", name: "Vietcombank" },
  { bin: "970415", name: "VietinBank" },
  { bin: "970418", name: "BIDV" },
  { bin: "970405", name: "Agribank" },
  { bin: "970407", name: "Techcombank" },
  { bin: "970422", name: "MB Bank" },
  { bin: "970432", name: "VPBank" },
  { bin: "970423", name: "TPBank" },
  { bin: "970403", name: "Sacombank" },
  { bin: "970437", name: "HDBank" },
  { bin: "970441", name: "VIB" },
  { bin: "970443", name: "SHB" },
  { bin: "970431", name: "Eximbank" },
  { bin: "970426", name: "MSB" },
  { bin: "970448", name: "OCB" },
  { bin: "970440", name: "SeABank" },
  { bin: "970449", name: "LPBank" },
  { bin: "970428", name: "Nam A Bank" },
  { bin: "970409", name: "Bac A Bank" },
  { bin: "970425", name: "ABBANK" },
  { bin: "970454", name: "BVBank (Bản Việt)" },
  { bin: "970452", name: "KienlongBank" },
  { bin: "970412", name: "PVcomBank" },
  { bin: "970433", name: "VietBank" },
];

const bankName = (bin) => (BANKS.find((b) => b.bin === bin) || {}).name || "";

// CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF) theo yêu cầu EMVCo
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const tlv = (id, value) => id + String(value.length).padStart(2, "0") + value;

// amount (VNĐ, số nguyên) và note là tùy chọn. Có amount => QR động, app tự điền số tiền.
function vietQrPayload({ bin, account, amount, note }) {
  const merchant = tlv("00", "A000000727") + tlv("01", tlv("00", bin) + tlv("01", account)) + tlv("02", "QRIBFTTA");
  let s = tlv("00", "01") + tlv("01", amount ? "12" : "11") + tlv("38", merchant) + tlv("53", "704");
  if (amount) s += tlv("54", String(Math.round(amount)));
  s += tlv("58", "VN");
  if (note) s += tlv("62", tlv("08", note.slice(0, 25)));
  s += "6304";
  return s + crc16(s);
}

// Bỏ dấu cho nội dung chuyển khoản (app ngân hàng thường không nhận ký tự có dấu)
const asciiNote = (s) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^A-Za-z0-9 ]/g, "").trim();

if (typeof module !== "undefined") module.exports = { BANKS, bankName, crc16, vietQrPayload, asciiNote };
