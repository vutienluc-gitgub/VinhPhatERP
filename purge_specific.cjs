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

async function run() {
  const cssPath = 'src/styles/data-ui.css';
  const css = fs.readFileSync(cssPath, 'utf8');
  const unusedClasses = [
    'task-list', 'task-item', 'task-item-icon', 'task-item-text', 
    'task-item-count', 'is-alert', 'task-empty'
  ];

  const result = await postcss([plugin({ unusedClasses })]).process(css, { from: cssPath, to: cssPath });
  fs.writeFileSync(cssPath, result.css);
  console.log(`Purged ${cssPath}`);
}

run();
