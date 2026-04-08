const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'src', 'features');
const features = fs
  .readdirSync(featuresDir)
  .filter((f) => fs.statSync(path.join(featuresDir, f)).isDirectory());

const circular = [];

features.forEach((feature) => {
  const indexPath = path.join(featuresDir, feature, 'index.ts');
  if (!fs.existsSync(indexPath)) return;

  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const moduleFiles = fs
    .readdirSync(path.join(featuresDir, feature))
    .filter((f) => f.includes('module'));

  moduleFiles.forEach((moduleFile) => {
    const modulePath = path.join(featuresDir, feature, moduleFile);
    const moduleContent = fs.readFileSync(modulePath, 'utf8');

    // Check if module imports index
    if (
      moduleContent.includes("import('./index')") ||
      moduleContent.includes("import('@/features/" + feature + "')")
    ) {
      circular.push({ feature, moduleFile });
    }
  });
});

console.log('Circular dependencies found:', circular);
