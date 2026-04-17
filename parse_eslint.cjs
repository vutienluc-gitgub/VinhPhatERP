const fs = require('fs');
let buf = fs.readFileSync('eslint.json');
let content = buf.toString('utf16le');
if(content[0] !== '[') content = buf.toString('utf8');
// remove BOM if present
if(content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
const data = JSON.parse(content);
data.forEach(f => {
  const msgs = f.messages.filter(m => m.ruleId === '@typescript-eslint/naming-convention');
  if(msgs.length > 0) {
    msgs.forEach(m => console.log(`${f.filePath.replace(/\\/g, '/')}:${m.line} - ${m.message.split('\`')[1]}`));
  }
});
