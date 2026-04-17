import fs from 'fs';

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

let content = fs.readFileSync('lint_source.txt', 'utf8');
let currentFile = null;
let changes = {};

content.split('\n').forEach(line => {
  line = line.replace(/\r/g, '');
  if (!line.trim()) return;
  
  if (!line.startsWith(' ')) {
    currentFile = line;
  } else {
    // parse line
    const matchLineCol = line.match(/^\s*(\d+):(\d+)/);
    const matchName = line.match(/name `([^`]+)`/);
    if (matchLineCol && matchName) {
       const lnum = parseInt(matchLineCol[1], 10);
       const varName = matchName[1];
       if (!changes[currentFile]) changes[currentFile] = [];
       changes[currentFile].push({ line: lnum, varName });
    }
  }
});

let count = 0;
for (const [file, items] of Object.entries(changes)) {
  if (fs.existsSync(file)) {
    let fileLines = fs.readFileSync(file, 'utf8').split('\n');
    items.forEach(item => {
      const idx = item.line - 1;
      const camel = toCamelCase(item.varName);
      const regex = new RegExp('\\b' + item.varName + '\\b', 'g'); // Replace all occurrences on that exact line
      if (regex.test(fileLines[idx])) {
        fileLines[idx] = fileLines[idx].replace(regex, camel);
        count++;
      }
    });
    fs.writeFileSync(file, fileLines.join('\n'));
  } else {
    console.log(`File not found: ${file}`);
  }
}
console.log(`Fixed ${count} occurrences from lint_source.txt.`);
