const fs = require('fs');
const path = require('path');
const sql = fs.readFileSync('d:/VinhPhatERP_v3/supabase/migrations/20260417015228_rename_rpc_functions.sql', 'utf8');
const renames = [];
const regex = /ALTER FUNCTION public\.(\w+)\s+RENAME TO\s+(\w+)/g;
let match;
while((match = regex.exec(sql)) !== null) {
  renames.push({old: match[1], new: match[2]});
}
function walk(dir) {
  let files = fs.readdirSync(dir);
  files.forEach(file => {
    const p = path.join(dir, file);
    if(fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let content = fs.readFileSync(p, 'utf8');
      let modified = false;
      renames.forEach(r => {
        const s1 = "'" + r.old + "'";
        const s2 = '"' + r.old + '"';
        const s3 = r.old + ": {";
        if(content.includes(s1)) { content = content.split(s1).join("'" + r.new + "'"); modified = true; }
        if(content.includes(s2)) { content = content.split(s2).join('"' + r.new + '"'); modified = true; }
        if(content.includes(s3)) { content = content.split(s3).join(r.new + ": {"); modified = true; }
      });
      if(modified) {
        fs.writeFileSync(p, content, 'utf8');
        console.log('Updated ' + p);
      }
    }
  });
}
walk('d:/VinhPhatERP_v3/src');
console.log('Done!');
