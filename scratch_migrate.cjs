const fs = require('fs');
const path = require('path');

const projectDir = process.cwd();

// Recursively find all TSX files
function scanDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(scanDir(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const map = {
  'hide-mobile': 'max-sm:hidden',
  'td-muted': 'text-muted text-sm',
  'td-actions': 'whitespace-nowrap text-right',
  'numeric-cell': 'text-right tabular-nums',
  'is-error': 'border-danger',
  'is-active': 'text-primary bg-primary/10',
  'is-success': 'text-emerald-500 bg-emerald-500/10'
};

function migrateClasses() {
  const allFiles = scanDir(path.join(projectDir, 'src'));
  let changedFilesCount = 0;

  for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    for (const [oldCls, newCls] of Object.entries(map)) {
      // We want to replace whole words only, avoiding partial matches like 'hide-mobile-extra'
      // We can use a regex with word boundaries
      const regex = new RegExp(`\\b${oldCls}\\b`, 'g');
      content = content.replace(regex, newCls);
    }

    if (content !== original) {
      fs.writeFileSync(file, content);
      changedFilesCount++;
    }
  }

  console.log(`Migrated classes in ${changedFilesCount} files.`);
}

migrateClasses();
