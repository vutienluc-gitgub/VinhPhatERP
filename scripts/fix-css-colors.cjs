const fs = require('fs');
const glob = require('glob');
const path = require('path');

function run() {
  const cssFiles = glob.sync('src/**/*.css');
  let totalFilesModified = 0;
  let totalReplacements = 0;

  for (const file of cssFiles) {
    const filePath = path.resolve(file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix color: var(--surface-subtle) -> color: var(--muted-foreground)
    const newContent = content.replace(/color:\s*var\(--surface-subtle\)/g, () => {
      modified = true;
      totalReplacements++;
      return 'color: var(--muted-foreground)';
    });

    // Fix border-color: var(--surface-subtle) -> border-color: var(--border-muted)
    const finalContent = newContent.replace(/border-color:\s*var\(--surface-subtle\)/g, () => {
      modified = true;
      totalReplacements++;
      return 'border-color: var(--border-muted)';
    });

    if (modified) {
      fs.writeFileSync(filePath, finalContent, 'utf-8');
      console.log(`Fixed ${file}`);
      totalFilesModified++;
    }
  }

  console.log(`\n✅ Fixed ${totalFilesModified} files with ${totalReplacements} replacements.`);
}

run();
