const fs = require('fs');
const path = require('path');

const pluginsPath = path.join(__dirname, 'src', 'app', 'plugins.ts');
const pluginsContent = fs.readFileSync(pluginsPath, 'utf8');

const importRegex = /import\s+{\s*(\w+)\s*}\s*from\s*'@\/features\/([^']+)'/g;
let match;
const results = [];

while ((match = importRegex.exec(pluginsContent)) !== null) {
  const pluginName = match[1];
  const featurePath = match[2];
  const indexPath = path.join(
    __dirname,
    'src',
    'features',
    featurePath,
    'index.ts',
  );

  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    // Check if indexContent exports pluginName
    // simple check: does it contain pluginName?
    if (
      !indexContent.includes(pluginName) &&
      !indexContent.includes('export *')
    ) {
      results.push({ pluginName, featurePath, status: 'Missing in index.ts' });
    }
  } else {
    results.push({ pluginName, featurePath, status: 'index.ts not found' });
  }
}

console.log(JSON.stringify(results, null, 2));
