const fs = require('fs');
const path = require('path');

function findLegacyComboboxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findLegacyComboboxFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('import { Combobox }') || content.includes('<Combobox')) {
        if (content.includes('@/shared/components/Combobox') || content.match(/import\s+\{.*Combobox.*\}\s+from\s+['"]@\/shared\/components\/Combobox['"]/)) {
          fileList.push(filePath.replace(process.cwd() + '\\', '').replace(/\\/g, '/'));
        }
      }
    }
  }
  return fileList;
}

const legacyFiles = findLegacyComboboxFiles(path.join(process.cwd(), 'src'));
fs.writeFileSync('.eslint-legacy-combobox.json', JSON.stringify(legacyFiles, null, 2));
console.log(`Found ${legacyFiles.length} files.`);
