const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const problems = [];

walkDir('src/features', function(filePath) {
    if (filePath.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('<PageHeader') && content.includes('actions={')) {
            // Find everything from actions={ until the matching closing brace
            const actionsIndex = content.indexOf('actions={');
            if (actionsIndex === -1) return;
            
            let braceCount = 0;
            let endOfActions = -1;
            
            for (let i = actionsIndex + 8; i < content.length; i++) {
                if (content[i] === '{') braceCount++;
                if (content[i] === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        endOfActions = i;
                        break;
                    }
                }
            }
            
            if (endOfActions !== -1) {
                const actionsBlock = content.substring(actionsIndex, endOfActions + 1);
                const buttonCount = (actionsBlock.match(/<Button|<AddButton/g) || []).length;
                
                // If it doesn't have flex-wrap, and has multiple buttons
                if (buttonCount >= 2 && !actionsBlock.includes('flex-wrap')) {
                    problems.push(filePath.replace(/\\/g, '/'));
                }
            }
        }
    }
});

console.log(problems.join('\n'));
