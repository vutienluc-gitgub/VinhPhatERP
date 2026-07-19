const fs = require('fs');
const p = require('child_process');
const out = p.execSync('rg -l "<PageHeader" src/features').toString().split('\n').filter(Boolean);
out.forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('actions={') && c.includes('<div') && c.includes('gap-')) {
    const match = c.match(/actions=\{([\s\S]*?)<\/div>/);
    if (match) {
        // If there is more than one button/component
        const actionsBlock = match[1];
        const count = (actionsBlock.match(/<Button|<AddButton/g) || []).length;
        if (count >= 2) {
            console.log(f);
        }
    }
  }
});
