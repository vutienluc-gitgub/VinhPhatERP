const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.module.ts') || file.endsWith('.module.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/features');
let fixed = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes(`import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';`)) {
    let newContent = content.replace(/(import type \{ FeaturePlugin \} from '@\/shared\/lib\/FeatureRegistry';\r?\n)/g, '');
    newContent = `import type { FeaturePlugin } from '@/shared/lib/FeatureRegistry';\n` + newContent;
    fs.writeFileSync(f, newContent);
    fixed++;
  }
});
console.log('Moved FeaturePlugin imports:', fixed);
