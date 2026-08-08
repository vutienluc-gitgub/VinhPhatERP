const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const REGEX = /(?:^|\s)(text|bg|border)-(white|black|transparent|(gray|red|blue|green|yellow|orange|purple|pink|indigo|slate|emerald|teal|amber|rose)-\d{3})(?:\/\d+)?(?:\s|$)/g;

let totalFiles = 0;
let totalViolations = 0;
const report = {};

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let match;
  let fileViolations = [];
  
  // Need a regex that doesn't consume overlapping spaces, so we use matchAll on a slightly modified regex or just match with lookaround.
  // Actually, we can just split by lines and check each line.
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Basic test to see if line contains violation
    const matches = [...line.matchAll(/(?:^|\s|["'`])(text|bg|border)-(white|black|transparent|(gray|red|blue|green|yellow|orange|purple|pink|indigo|slate|emerald|teal|amber|rose)-\d{3})(?:\/\d+)?(?:["'`]|\s|$)/g)];
    if (matches.length > 0) {
      matches.forEach(m => {
        fileViolations.push({
          line: index + 1,
          content: line.trim(),
          match: m[0].trim().replace(/['"`]/g, '')
        });
        totalViolations++;
      });
    }
  });

  if (fileViolations.length > 0) {
    report[filePath.replace(path.join(__dirname, '..'), '')] = fileViolations;
    totalFiles++;
  }
}

console.log('Bắt đầu quét thư mục src/ ...');
scanDirectory(SRC_DIR);

console.log(`\nHoàn thành! Đã tìm thấy ${totalViolations} lỗi vi phạm Hardcoded Color tại ${totalFiles} file.`);
console.log('Xuất báo cáo ra file dark_mode_audit_report.json ...');
fs.writeFileSync(path.join(__dirname, '../dark_mode_audit_report.json'), JSON.stringify(report, null, 2));

console.log('Tạo artifact báo cáo tóm tắt...');
// Write summary to console
const sortedFiles = Object.entries(report)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 10);

console.log('\nTop 10 file vi phạm nhiều nhất:');
sortedFiles.forEach(([file, violations]) => {
  console.log(`- ${file}: ${violations.length} lỗi`);
});
