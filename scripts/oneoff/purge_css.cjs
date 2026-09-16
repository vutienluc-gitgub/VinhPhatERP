const fs = require('fs');
const postcss = require('postcss');

const plugin = postcss.plugin('purge-dead-classes', (opts = {}) => {
  return (root) => {
    root.walkRules((rule) => {
      let shouldRemove = false;
      const selectors = rule.selector.split(',').map(s => s.trim());
      
      const newSelectors = selectors.filter(sel => {
        let isDead = false;
        for (const cls of opts.unusedClasses) {
          const regex = new RegExp(`\\.${cls}(?![a-zA-Z0-9_-])`);
          if (regex.test(sel)) {
            isDead = true;
            break;
          }
        }
        return !isDead;
      });

      if (newSelectors.length === 0) {
        rule.remove();
      } else if (newSelectors.length !== selectors.length) {
        rule.selector = newSelectors.join(', ');
      }
    });
    
    root.walkAtRules((atRule) => {
      if (atRule.nodes && atRule.nodes.length === 0) {
        atRule.remove();
      }
    });
  };
});

async function processFile(cssPath, auditPath) {
  const css = fs.readFileSync(cssPath, 'utf8');
  const audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  
  const unusedClasses = audit.unusedClasses;
  if (!unusedClasses || unusedClasses.length === 0) return;

  const result = await postcss([plugin({ unusedClasses })]).process(css, { from: cssPath, to: cssPath });
  
  fs.writeFileSync(cssPath, result.css);
  console.log(`Purged ${cssPath}`);
}

async function run() {
  await processFile(
    'src/styles/app-shell.css',
    'C:/Users/Admin/.gemini/antigravity-ide/brain/ec853bd6-0f41-4230-a280-932a3ffe3624/scratch/app-shell.css.audit.json'
  );
  await processFile(
    'src/styles/data-ui.css',
    'C:/Users/Admin/.gemini/antigravity-ide/brain/ec853bd6-0f41-4230-a280-932a3ffe3624/scratch/data-ui.css.audit.json'
  );
}

run();
