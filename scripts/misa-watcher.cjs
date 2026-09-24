const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://quantri.detmayvinhphat.com';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const VINH_PHAT_MST = '0318633734';

const watchDirs = [
  path.join(__dirname, '..', 'scratch', 'uploads'),
  path.join(__dirname, '..', 'private', 'data')
];

const logFile = path.join(__dirname, '..', 'scratch', 'misa_watcher.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(logFile, line + '\n');
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? match[1].trim() : '';
}

function extractAllTags(xml, tag) {
  const matches = [];
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g');
  let m;
  while ((m = regex.exec(xml)) !== null) {
    matches.push(m[1].trim());
  }
  return matches;
}

// Xử lý hóa đơn XML
async function handleXML(filePath) {
  try {
    const xml = fs.readFileSync(filePath, 'utf-8');
    const shDon = extractTag(xml, 'SHDon');
    const khHDon = extractTag(xml, 'KHHDon');
    const nLap = extractTag(xml, 'NLap');
    const sellerMST = extractTag(extractTag(xml, 'NBan'), 'MST');
    const sellerName = extractTag(extractTag(xml, 'NBan'), 'Ten');
    const buyerMST = extractTag(extractTag(xml, 'NMua'), 'MST');
    const buyerName = extractTag(extractTag(xml, 'NMua'), 'Ten');
    const totalAmount = extractTag(xml, 'TgTTTBSo');

    const isSales = sellerMST === VINH_PHAT_MST;
    const partnerName = isSales ? buyerName : sellerName;
    const partnerMST = isSales ? buyerMST : sellerMST;

    log(`[WATCHER AUTO] 📄 Hóa đơn: ${khHDon}-${shDon} (${nLap})`);
    log(`  Loại: ${isSales ? 'BÁN RA (Sales)' : 'MUA VÀO (Purchase)'} | Đối tác: ${partnerName} (MST: ${partnerMST})`);
    log(`  Tổng tiền: ${Number(totalAmount).toLocaleString('vi-VN')} VND`);

    const items = extractAllTags(xml, 'HHDVu');
    log(`  Chi tiết hàng hóa (${items.length} mặt hàng):`);
    items.forEach((item, idx) => {
      const code = extractTag(item, 'MHHDVu');
      const name = extractTag(item, 'THHDVu');
      const qty = extractTag(item, 'SLuong');
      const price = extractTag(item, 'DGia');
      log(`    ${idx+1}. [${code}] ${name} - SL: ${qty} - ĐG: ${Number(price).toLocaleString('vi-VN')} đ`);
    });
  } catch (err) {
    log(`[WATCHER ERROR] Lỗi đọc file XML ${path.basename(filePath)}: ${err.message}`);
  }
}

// Theo dõi thư mục
const processed = new Set();

log('==================================================');
log('🤖 MISA File Watcher Daemon đã được kích hoạt');
log(`Thư mục đang theo dõi:`);
watchDirs.forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  log(` - ${d}`);
});
log('==================================================');

watchDirs.forEach(dir => {
  fs.watch(dir, (eventType, filename) => {
    if (!filename) return;
    const fullPath = path.join(dir, filename);
    const key = `${filename}_${Date.now()}`;

    // Debounce 2 giay
    if (processed.has(filename)) return;
    processed.add(filename);
    setTimeout(() => processed.delete(filename), 3000);

    if (fs.existsSync(fullPath)) {
      const ext = path.extname(filename).toLowerCase();
      log(`[WATCHER EVENT] Phát hiện file mới: ${filename} trong ${path.basename(dir)}`);
      if (ext === '.xml') {
        handleXML(fullPath);
      } else if (ext === '.csv' || ext === '.xlsx') {
        log(`[WATCHER NOTIFY] File bảng tính ${filename} đã sẵn sàng trong ${path.basename(dir)}.`);
      }
    }
  });
});
