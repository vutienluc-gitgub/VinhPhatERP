const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const c = fs.readFileSync(file, 'utf8');
        if (/[áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]/.test(c)) {
          if (!file.includes('constants.ts')) {
            results.push(file);
          }
        }
      }
    }
  });
  return results;
}
const files = walk('src/features');
const counts = {};
files.forEach(f => {
  const module = f.split(path.sep)[2]; // src/features/module
  counts[module] = (counts[module] || 0) + 1;
});
console.log(Object.entries(counts).sort((a,b) => b[1] - a[1]).map(e => e[0] + ': ' + e[1]).join('\n'));
