const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, 'src/features');
const features = fs.readdirSync(featuresDir);

for (const feature of features) {
  const isDir = fs.statSync(path.join(featuresDir, feature)).isDirectory();
  if (!isDir) continue;

  const indexFile = path.join(featuresDir, feature, 'index.ts');
  const moduleFileTs = path.join(featuresDir, feature, `${feature}.module.ts`);
  const moduleFileTsx = path.join(
    featuresDir,
    feature,
    `${feature}.module.tsx`,
  );

  const exists = fs.existsSync(moduleFileTs) || fs.existsSync(moduleFileTsx);
  if (exists) {
    if (fs.existsSync(indexFile)) {
      const idxContent = fs.readFileSync(indexFile, 'utf8');
      // Fix: only append if it doesn't already export the plugin explicitly or export *
      if (
        !idxContent.includes(`export * from './${feature}.module'`) &&
        !idxContent.includes(`${feature}Plugin`)
      ) {
        fs.appendFileSync(
          indexFile,
          `\nexport * from './${feature}.module'\n`,
          'utf8',
        );
      }
    } else {
      fs.writeFileSync(
        indexFile,
        `export * from './${feature}.module'\n`,
        'utf8',
      );
    }
  }
}
