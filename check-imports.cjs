const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(filePath);
    }
  });
  return results;
}

const featuresDir = path.join(__dirname, 'src/features');
const files = walk(featuresDir);
let found = false;

for (const f of files) {
  const relativePath = path.relative(featuresDir, f);
  // first folder in relative path
  const myFeature = relativePath.split(path.sep)[0];

  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/from\s+['"]@\/features\/([^/'"]+)/);
    if (m && m[1] !== myFeature) {
      console.log('Cross-feature import in', relativePath, '-> imports', m[1]);
      found = true;
    }

    // Also check relative imports escaping out of the feature
    const relativeMatch = lines[i].match(/from\s+['"](?:\.\.\/)+([^/'"]+)/);
    if (relativeMatch) {
      console.log(
        'Relative Cross-feature import in',
        relativePath,
        '-> imports module outside it. Line:',
        i + 1,
        lines[i],
      );
      found = true;
    }
  }
}
if (!found) console.log('NO_CROSS_FEATURE_IMPORTS');
