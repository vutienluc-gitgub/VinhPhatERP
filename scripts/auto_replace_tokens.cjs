const fs = require('fs');
const path = require('path');

const targetDir = path.join(process.cwd(), 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const allTsx = getAllFiles(targetDir);
const hardcodedColorsRegex = /(text|bg|border|fill|stroke)-(gray|red|blue|green|yellow|orange|purple|pink|indigo|slate|emerald|teal|amber|rose)-(\d{3})/g;

let totalReplaced = 0;

allTsx.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  let fileReplacedCount = 0;
  newContent = newContent.replace(hardcodedColorsRegex, (match, prefix, color, weight, offset, fullString) => {
    // Find nearest tag before this match
    const beforeStr = fullString.substring(0, offset);
    const tagMatch = beforeStr.match(/<([A-Za-z0-9_]+)[^>]*$/);
    const tag = tagMatch ? tagMatch[1].toLowerCase() : 'unknown';

    let replacement = match;

    // --- Foreground / Text colors ---
    if (prefix === 'text') {
      if (color === 'gray' || color === 'slate') {
        if (weight === '900' || weight === '800') {
          if (['h1','h2','h3','h4','h5','h6','th'].includes(tag)) {
            replacement = 'text-foreground';
          } else {
            replacement = 'text-primary';
          }
        }
        else if (weight === '700') replacement = 'text-secondary';
        else if (weight === '600' || weight === '500') replacement = 'text-muted';
        else if (weight === '400') replacement = 'text-muted-foreground';
        else replacement = 'text-muted'; // fallback
      }
      else if (color === 'red' || color === 'rose') {
        replacement = 'text-danger';
      }
      else if (color === 'green' || color === 'emerald' || color === 'teal') {
        replacement = 'text-success';
      }
      else if (color === 'blue' || color === 'indigo') {
        replacement = 'text-info';
      }
      else if (color === 'yellow' || color === 'amber' || color === 'orange') {
        if (weight >= '700') replacement = 'text-warning-strong';
        else replacement = 'text-warning';
      }
    }
    // --- Background colors ---
    else if (prefix === 'bg') {
      if (color === 'gray' || color === 'slate') {
        if (weight <= '200') replacement = 'bg-surface-secondary';
        else replacement = 'bg-surface-strong';
      }
      else if (color === 'red' || color === 'rose') {
        replacement = 'bg-danger-soft';
      }
      else if (color === 'green' || color === 'emerald' || color === 'teal') {
        replacement = 'bg-success-soft';
      }
      else if (color === 'blue' || color === 'indigo') {
        replacement = 'bg-info-soft';
      }
      else if (color === 'yellow' || color === 'amber' || color === 'orange') {
        replacement = 'bg-warning-soft';
      }
    }
    // --- Border colors ---
    else if (prefix === 'border') {
      if (color === 'gray' || color === 'slate') {
        if (weight <= '200') replacement = 'border-default';
        else if (weight === '300') replacement = 'border-muted';
        else replacement = 'border-focus';
      }
      else if (color === 'red' || color === 'rose') {
        replacement = 'border-danger';
      }
      else if (color === 'green' || color === 'emerald' || color === 'teal') {
        replacement = 'border-success'; 
      }
      else if (color === 'blue' || color === 'indigo') {
        replacement = 'border-info';
      }
      else if (color === 'yellow' || color === 'amber' || color === 'orange') {
        replacement = 'border-warning';
      }
    }

    if (replacement !== match) {
      fileReplacedCount++;
      totalReplaced++;
    }
    return replacement;
  });

  if (fileReplacedCount > 0) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Replaced ${fileReplacedCount} tokens in ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\n🎉 Total tokens replaced: ${totalReplaced}`);
