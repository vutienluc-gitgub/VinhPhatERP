import fs from 'fs';
import path from 'path';
import glob from 'glob';

const CLASS_REPLACEMENTS = {
  'text-primary': 'text-foreground',
  'text-secondary': 'text-muted-foreground',
  'text-muted': 'text-muted-foreground',
  'text-tertiary': 'text-muted-foreground',
  'text-disabled': 'text-disabled-foreground',
  'text-inverse': 'text-inverse-foreground',
};

const CSS_VAR_REPLACEMENTS = {
  'var(--text)': 'var(--foreground)',
  'var(--text-primary)': 'var(--foreground)',
  'var(--text-secondary)': 'var(--muted-foreground)',
  'var(--text-muted)': 'var(--muted-foreground)',
  'var(--text-tertiary)': 'var(--muted-foreground)',
  'var(--text-disabled)': 'var(--disabled-foreground)',
  'var(--text-inverse)': 'var(--inverse-foreground)',
  'var(--muted)': 'var(--surface-subtle)',
};

const FILES_TO_SCAN = glob.sync('src/**/*.{tsx,ts,css}', { ignore: ['node_modules/**'] });

let totalFilesModified = 0;
let totalReplacements = 0;

FILES_TO_SCAN.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  for (const [oldClass, newClass] of Object.entries(CLASS_REPLACEMENTS)) {
    const regex = new RegExp(`(?<![a-zA-Z0-9_-])${oldClass}(?![a-zA-Z0-9_-])`, 'g');
    newContent = newContent.replace(regex, () => {
      totalReplacements++;
      return newClass;
    });
  }

  for (const [oldVar, newVar] of Object.entries(CSS_VAR_REPLACEMENTS)) {
    const escapedOldVar = oldVar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedOldVar, 'g');
    newContent = newContent.replace(regex, () => {
      totalReplacements++;
      return newVar;
    });
  }

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    totalFilesModified++;
    console.log(`Updated ${file}`);
  }
});

console.log(`\n✅ Refactor complete! Modified ${totalFilesModified} files with ${totalReplacements} replacements.`);
