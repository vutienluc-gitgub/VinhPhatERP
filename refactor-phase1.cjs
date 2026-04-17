const fs = require('fs');
const path = require('path');

const modelsDir = path.join(process.cwd(), 'src/models');
const files = fs.readdirSync(modelsDir);

for (const file of files) {
  if (file === 'common.ts') continue;
  const filePath = path.join(modelsDir, file);
  if (!fs.statSync(filePath).isFile()) continue;

  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(
    /from '\.\/common'/g,
    "from '@/shared/types/database.models'",
  );

  if (file === 'index.ts') {
    content = content.replace(/export \* from '\.\/common';\n?/g, '');
  }

  fs.writeFileSync(filePath, content);
}

const commonPath = path.join(modelsDir, 'common.ts');
if (fs.existsSync(commonPath)) {
  fs.unlinkSync(commonPath);
}

console.log('Phase 1 completed: Updated imports and deleted common.ts');
