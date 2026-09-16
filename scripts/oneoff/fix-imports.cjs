const fs = require('fs');
const path = require('path');

function fixImports(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix relative imports starting with ../
      content = content.replace(/from '\.\.\/([^']+)'/g, "from '@/domains/approval/$1'");
      
      // Fix relative imports starting with ./
      const folderName = path.basename(dirPath);
      // Special case: don't replace ./ if it's not a domain folder, but here we only have models, repositories, services, ui, utils
      content = content.replace(/from '\.\/([^']+)'/g, `from '@/domains/approval/${folderName}/$1'`);

      fs.writeFileSync(fullPath, content);
    }
  }
}

fixImports(path.join(__dirname, 'src/domains/approval'));
console.log('Fixed relative imports');
