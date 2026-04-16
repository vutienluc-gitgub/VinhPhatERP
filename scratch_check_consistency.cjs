const fs = require('fs');
const path = require('path');

function findInconsistencies() {
  const dir = './src/features';
  function traverse(currentDir) {
    let results = [];
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        results = results.concat(traverse(fullPath));
      } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        results.push(fullPath);
      }
    }
    return results;
  }
  
  const allFiles = traverse(dir);
  let metrics = {
    huyY: 0,
    huyU: 0,
    nativeButtonSubmit: 0,
    uiButtonSubmit: 0,
    nativeButtonHuy: 0,
    uiButtonHuy: 0
  };

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('Huỷ')) metrics.huyY++;
    if (content.includes('Hủy')) metrics.huyU++;
    if (/<button[^>]*type=['"]submit['"][^>]*>/i.test(content)) metrics.nativeButtonSubmit++;
    if (/<Button[^>]*type=['"]submit['"][^>]*>/i.test(content)) metrics.uiButtonSubmit++;
    if (content.includes('>Hủy</button>') || content.includes('>Huỷ</button>')) metrics.nativeButtonHuy++;
    if (content.includes('>Hủy</Button>') || content.includes('>Huỷ</Button>')) metrics.uiButtonHuy++;
  }
  console.log(JSON.stringify(metrics, null, 2));
}
findInconsistencies();
