const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const allTsx = getAllFiles(targetDir);
const hardcodedColorsRegex = /(text|bg|border|fill|stroke)-(gray|red|blue|green|yellow|orange|purple|pink|indigo|slate|emerald|teal|amber|rose)-(\d{3})/g;

const colorSemanticMap = {
  'text-gray-900': 'text-foreground hoặc text-primary',
  'text-gray-800': 'text-primary',
  'text-gray-700': 'text-secondary',
  'text-gray-600': 'text-muted',
  'text-gray-500': 'text-muted',
  'text-gray-400': 'text-muted-foreground',
  'text-gray-300': 'text-disabled',
  'bg-gray-100': 'bg-surface-secondary',
  'bg-gray-200': 'bg-surface-secondary',
  'border-gray-200': 'border-default',
  'border-gray-300': 'border-muted',
  'text-red-500': 'text-danger',
  'text-red-600': 'text-danger',
  'bg-red-100': 'bg-danger-soft',
  'bg-red-50': 'bg-danger-soft',
  'text-green-600': 'text-success',
  'text-green-700': 'text-success',
  'bg-green-100': 'bg-success-soft',
  'bg-green-50': 'bg-success-soft',
  'text-blue-500': 'text-info hoặc text-link',
  'text-blue-600': 'text-info hoặc text-link',
  'bg-blue-100': 'bg-info-soft',
  'bg-blue-50': 'bg-info-soft',
  'text-yellow-500': 'text-warning',
  'text-yellow-600': 'text-warning',
  'text-yellow-800': 'text-warning-strong',
  'bg-yellow-100': 'bg-warning-soft',
  'bg-yellow-50': 'bg-warning-soft',
};

const suggestions = [];

allTsx.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(process.cwd(), file).replace(/\\/g, '/');
  
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    let match;
    while ((match = hardcodedColorsRegex.exec(line)) !== null) {
      const fullMatch = match[0];
      // Exclude if it's commented out
      if (line.includes('//')) continue; 
      
      const suggested = colorSemanticMap[fullMatch] || `Semantic Token (VD: text-muted, bg-surface)`;
      suggestions.push({
        file: relPath,
        lineNum: index + 1,
        code: line.trim(),
        match: fullMatch,
        suggestion: suggested
      });
    }
  });
});

const markdown = [
  '# 🎨 Design Token Replacement Review (Step 1)',
  '',
  '> Các báo cáo dưới đây chỉ là gợi ý thay đổi. File mã nguồn KHÔNG BỊ SỬA tự động.',
  '> Vui lòng Review từng class và tìm Token ngữ nghĩa (Semantic Token) phù hợp nhất với context của Component.',
  ''
];

// Group by file
const grouped = suggestions.reduce((acc, s) => {
  if (!acc[s.file]) acc[s.file] = [];
  acc[s.file].push(s);
  return acc;
}, {});

for (const [file, items] of Object.entries(grouped)) {
  markdown.push(`## \`${file}\``);
  items.forEach(item => {
    markdown.push(`- **Line ${item.lineNum}**: \`${item.match}\` ➡️ **Suggest:** \`${item.suggestion}\``);
    markdown.push(`  \`\`\`tsx\n  ${item.code}\n  \`\`\``);
  });
  markdown.push('');
}

fs.writeFileSync(path.join(process.cwd(), 'ui_color_suggestions.md'), markdown.join('\n'));
console.log('Successfully generated ui_color_suggestions.md with ' + suggestions.length + ' suggestions.');
