const fs = require('fs');
const path = require('path');

const pluginsFilePath = path.join(__dirname, 'src/app/plugins.ts');
let content = fs.readFileSync(pluginsFilePath, 'utf8');

// Regex to find all object blocks in plugins.ts
// Format:
//   {
//     key: 'module_name',
//     ...
//   },
const regex = /\{\s*key:\s*'([^']+)',([\s\S]*?)(?=\},|\n\s*\])\}/g;

let match;
const imports = new Set();
const newLines = [];

let lastIndex = 0;
let updatedContent = '';

while ((match = regex.exec(content)) !== null) {
  const pluginObjectStr = match[0];
  const key = match[1];

  if (key === 'customers') continue; // already manually did this

  // We want to create a module file in src/features/${key}/${key}.module.ts
  const featureDir = path.join(__dirname, `src/features/${key}`);

  // Create dir if not exists
  if (!fs.existsSync(featureDir)) {
    fs.mkdirSync(featureDir, { recursive: true });
  }

  // Format the name of the export, e.g., ordersPlugin
  const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const pluginExportName = `${camelCaseKey}Plugin`;

  // Clean up component mapping for local import:
  // () => import('@/features/orders').then((m) => ({ default: m.OrdersPage }))
  // turns into
  // () => import('./OrdersPage').then((m) => ({ default: m.OrdersPage }))
  let moduleContent = pluginObjectStr;
  moduleContent = moduleContent.replace(
    /import\('@\/features\/[^']+'\)/g,
    `import('./index')`,
  );

  const moduleFileContent = `import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry'\n\nexport const ${pluginExportName}: FeaturePlugin = ${moduleContent}`;

  const moduleFilePath = path.join(featureDir, `${key}.module.ts`);
  fs.writeFileSync(moduleFilePath, moduleFileContent, 'utf8');

  // Append export to index.ts
  const indexFilePath = path.join(featureDir, `index.ts`);
  if (fs.existsSync(indexFilePath)) {
    const indexContent = fs.readFileSync(indexFilePath, 'utf8');
    if (!indexContent.includes(`${key}.module`)) {
      fs.writeFileSync(
        indexFilePath,
        indexContent + `\nexport * from './${key}.module'\n`,
        'utf8',
      );
    }
  } else {
    fs.writeFileSync(
      indexFilePath,
      `export * from './${key}.module'\n`,
      'utf8',
    );
  }

  // Record for replacing in plugins.ts
  imports.add(`import { ${pluginExportName} } from '@/features/${key}'`);
  updatedContent +=
    content.substring(lastIndex, match.index) + `  ${pluginExportName}`;
  lastIndex = match.index + match[0].length;
}

updatedContent += content.substring(lastIndex);

if (imports.size > 0) {
  const importsArray = Array.from(imports).join('\n');
  updatedContent = updatedContent.replace(
    /(import .*?\n)(?=\n\/\*\*)/,
    `$1${importsArray}\n`,
  );
}

fs.writeFileSync(pluginsFilePath, updatedContent, 'utf8');

console.log('Migration completed successfully!');
