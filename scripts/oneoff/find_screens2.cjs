const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('src/features', function(filePath) {
    if (filePath.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('<PageHeader') && content.includes('actions={')) {
            const actionsMatch = content.match(/actions=\{([\s\S]*?)(?:>|<\/div>)\s*\}/);
            if (actionsMatch) {
                const actionsBlock = actionsMatch[1];
                if (actionsBlock.includes('<div') && actionsBlock.includes('flex')) {
                    const buttonCount = (actionsBlock.match(/<Button/g) || []).length;
                    if (buttonCount >= 2) {
                        console.log(filePath);
                    }
                }
            }
        }
    }
});
