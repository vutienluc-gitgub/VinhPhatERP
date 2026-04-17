import { readFileSync, writeFileSync } from 'fs';
const data = JSON.parse(readFileSync('eslint.json', 'utf8'));
let out = '';
data.forEach(f => {
  const msgs = f.messages.filter(m => m.ruleId === '@typescript-eslint/naming-convention');
  if(msgs.length > 0) {
    msgs.forEach(m => {
      const msgMatch = m.message.match(/`([^`]+)`/);
      if(msgMatch) {
        out += `${f.filePath.replace(/\\/g, '/')}:${m.line} - ${msgMatch[1]}\n`;
      }
    });
  }
});
writeFileSync('eslint_parsed.txt', out);
