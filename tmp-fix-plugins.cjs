const fs = require('fs');
const path = require('path');
const cp = require('child_process');

let content = cp.execSync('git show HEAD:src/app/plugins.ts').toString();

const regex = /\{\s*key:\s*'([^']+)',([\s\S]*?)(?=\},|\n\s*\])\}/g;
let match;

while ((match = regex.exec(content)) !== null) {
  const pluginObjectStr = match[0];
  const key = match[1];

  if (key === 'customers') continue;

  const featureDir = path.join(__dirname, `src/features/${key}`);
  const moduleFilePathTs = path.join(featureDir, `${key}.module.ts`);
  const moduleFilePathTsx = path.join(featureDir, `${key}.module.tsx`);

  const targetPath = fs.existsSync(moduleFilePathTsx)
    ? moduleFilePathTsx
    : moduleFilePathTs;

  const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const pluginExportName = `${camelCaseKey}Plugin`;

  let moduleContent = pluginObjectStr;
  moduleContent = moduleContent.replace(
    /import\('@\/features\/[^']+'\)/g,
    `import('./index')`,
  );

  const appendText = `\nimport type { FeaturePlugin } from '@/shared/lib/FeatureRegistry'\nexport const ${pluginExportName}: FeaturePlugin = ${moduleContent}\n`;

  if (fs.existsSync(targetPath)) {
    let existingContent = fs.readFileSync(targetPath, 'utf8');
    if (!existingContent.includes(`export const ${pluginExportName}`)) {
      fs.appendFileSync(targetPath, appendText, 'utf8');
      console.log(`Appended to ${targetPath}`);
    }
  } else {
    fs.mkdirSync(featureDir, { recursive: true });
    fs.writeFileSync(targetPath, appendText.trim() + '\n', 'utf8');
    console.log(`Created ${targetPath}`);
  }
}
