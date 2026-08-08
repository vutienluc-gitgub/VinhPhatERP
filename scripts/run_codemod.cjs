const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
let totalModified = 0;

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  const originalContent = fs.readFileSync(filePath, 'utf8');
  let content = originalContent;

  // We need to apply replacements carefully.
  // Using word boundary \b is tricky because '-' is not a word character.
  // We'll use lookbehind/lookahead or explicit character groups.
  const regexGen = (pattern) => new RegExp(`([\\'\\"\\s\`])(${pattern})(\\/[0-9]+)?([\\'\\"\\s\`])`, 'g');

  const replacements = [
    { pattern: 'bg-white', replacement: 'bg-surface' },
    { pattern: 'text-white', replacement: 'text-inverse' },
    { pattern: 'text-black', replacement: 'text-foreground' },
    { pattern: 'bg-black', replacement: 'bg-foreground' },
    
    // Gray text
    { pattern: 'text-gray-[5-9]00', replacement: 'text-foreground' },
    { pattern: 'text-gray-[1-4]00', replacement: 'text-muted' },
    { pattern: 'text-gray-50', replacement: 'text-muted' },

    // Gray bg
    { pattern: 'bg-gray-1?00', replacement: 'bg-surface-secondary' },
    { pattern: 'bg-gray-[2-9]00', replacement: 'bg-surface-hover' },

    // Border
    { pattern: 'border-gray-[0-9]{2,3}', replacement: 'border-border' },
    { pattern: 'border-white', replacement: 'border-transparent' },
  ];

  replacements.forEach(({ pattern, replacement }) => {
    // Because some strings might have multiple matches in the same line sharing boundary characters,
    // we need to loop until no more matches are found to handle overlapping boundaries properly,
    // or we can just run it a few times (2-3 times is usually enough for tailwind classes).
    let r = regexGen(pattern);
    content = content.replace(r, `$1${replacement}$3$4`);
    content = content.replace(r, `$1${replacement}$3$4`); // run twice for overlapping boundaries like "bg-white text-white"
    content = content.replace(r, `$1${replacement}$3$4`);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath.replace(SRC_DIR, '')}`);
    totalModified++;
  }
}

console.log('Bắt đầu Codemod chạy dọc src/ ...');
scanDirectory(SRC_DIR);
console.log(`\nHoàn thành! Đã tự động refactor ${totalModified} file.`);
