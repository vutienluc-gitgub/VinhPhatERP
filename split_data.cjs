const fs = require('fs');

const dataUIPath = 'src/styles/data-ui.css';
let css = fs.readFileSync(dataUIPath, 'utf8');

// I will split by "/* ---- " and group sections
const sections = css.split(/\/\* ---- /);
const preamble = sections.shift(); // Before the first section

const groups = {
  form: [],
  table: [],
  badge: [],
  card: [],
  modal: [],
  misc: []
};

for (const sec of sections) {
  const headerEnd = sec.indexOf('----');
  const header = sec.substring(0, headerEnd).trim().toLowerCase();
  const content = '/* ---- ' + sec;

  if (header.includes('form') || header.includes('filter') || header.includes('combobox') || header.includes('input') || header.includes('bulk')) {
    groups.form.push(content);
  } else if (header.includes('table') || header.includes('pagination') || header.includes('legend') || header.includes('trace')) {
    groups.table.push(content);
  } else if (header.includes('badge') || header.includes('status') || header.includes('quality')) {
    groups.badge.push(content);
  } else if (header.includes('card') || header.includes('kanban') || header.includes('stat') || header.includes('panel')) {
    groups.card.push(content);
  } else if (header.includes('modal') || header.includes('sheet')) {
    groups.modal.push(content);
  } else {
    groups.misc.push(content);
  }
}

// Write files
fs.writeFileSync('src/styles/components/form.css', groups.form.join('\n'));
fs.writeFileSync('src/styles/components/table.css', groups.table.join('\n'));
fs.writeFileSync('src/styles/components/badge.css', groups.badge.join('\n'));
fs.writeFileSync('src/styles/components/card.css', groups.card.join('\n'));
fs.writeFileSync('src/styles/layout/modal.css', groups.modal.join('\n'));
fs.writeFileSync('src/styles/components/misc.css', preamble + '\n' + groups.misc.join('\n'));

console.log('Split data-ui.css successfully');
