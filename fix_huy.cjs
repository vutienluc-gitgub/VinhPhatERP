const fs = require('fs');
const path = require('path');

function replaceHuy() {
  const dir = './src/features';
  function traverse(currentDir) {
    let results = [];
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        results = results.concat(traverse(fullPath));
      } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        results.push(fullPath);
      }
    }
    return results;
  }

  const allFiles = traverse(dir);
  let changed = 0;
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('Huỷ')) {
      const newContent = content.replace(/Huỷ/g, 'Hủy');
      fs.writeFileSync(file, newContent, 'utf8');
      changed++;
    }
  }
  console.log(`Replaced 'Huỷ' with 'Hủy' in ${changed} files.`);
}
replaceHuy();
