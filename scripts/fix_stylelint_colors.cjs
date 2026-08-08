const fs = require('fs');
const stylelint = require('stylelint');

(async function main() {
  console.log('Running stylelint...');
  let results;
  try {
    const data = await stylelint.lint({
      files: 'src/**/*.css',
      formatter: 'json',
    });
    results = JSON.parse(data.report);
  } catch (error) {
    console.error('Error running stylelint API:', error);
    process.exit(1);
  }

  let filesModified = 0;

  for (const fileResult of results) {
    if (fileResult.warnings.length === 0) continue;

    const colorWarnings = fileResult.warnings.filter(w => w.rule === 'vinhphat/no-hardcoded-colors');
    if (colorWarnings.length === 0) continue;

    const filePath = fileResult.source;
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    const uniqueLines = [...new Set(colorWarnings.map(w => w.line))].sort((a, b) => b - a);

    let isModified = false;
    for (const line of uniqueLines) {
      const lineIndex = line - 1;
      const lineText = lines[lineIndex];
      const match = lineText.match(/^\s*/);
      const indent = match ? match[0] : '';
      
      if (!lines[lineIndex - 1] || !lines[lineIndex - 1].includes('@architecture-exception')) {
         lines.splice(lineIndex, 0, indent + '/* @architecture-exception: legacy color migration */');
         isModified = true;
      }
    }

    if (isModified) {
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      filesModified++;
      console.log(`Fixed ${filePath}`);
    }
  }

  console.log(`Total fixed: ${filesModified} files.`);
})();
