const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/features/*/index.ts');
let updatedCount = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const newLines = lines.filter(line => {
    // If it's exporting a Page or Form
    if (/^export\s+.*from\s+['"].*['"];?$/.test(line) || /^export\s+\{.*\}\s+from\s+['"].*['"];?$/.test(line)) {
      if (line.includes('Page') || line.includes('Form') || line.includes('ContractsFeature')) {
        return false;
      }
    }
    return true;
  });
  
  const newContent = newLines.join('\n');
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
    updatedCount++;
  }
});
console.log(`Finished processing, updated ${updatedCount} files.`);
