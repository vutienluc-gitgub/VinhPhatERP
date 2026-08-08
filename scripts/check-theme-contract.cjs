const fs = require('fs');
const path = require('path');

const tokensPath = path.join(__dirname, '../src/styles/theme/tokens.css');
const darkPath = path.join(__dirname, '../src/styles/theme/dark-mode.css');

if (!fs.existsSync(tokensPath) || !fs.existsSync(darkPath)) {
  console.error('Theme files not found.');
  process.exit(1);
}

const tokensContent = fs.readFileSync(tokensPath, 'utf8');
const darkContent = fs.readFileSync(darkPath, 'utf8');

function extractTokens(css) {
  const regex = /(--[a-zA-Z0-9-]+):/g;
  const tokens = new Set();
  let match;
  while ((match = regex.exec(css)) !== null) {
    tokens.add(match[1]);
  }
  return Array.from(tokens);
}

const lightTokens = extractTokens(tokensContent);
const darkTokens = extractTokens(darkContent);

const ignoreList = [
  '--brand-rgb', '--brand-strong-rgb', '--brand-zalo-rgb', 
  '--radius-xl', '--radius-lg', '--radius-md', '--radius-sm', '--radius-full',
  '--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow'
];

const missingInDark = lightTokens.filter(t => !darkTokens.includes(t) && !ignoreList.includes(t));
const missingInLight = darkTokens.filter(t => !lightTokens.includes(t) && !ignoreList.includes(t));

let hasError = false;

console.log('🔍 Theme Contract Check');
console.log('────────────────────────────────────────');

if (missingInDark.length > 0) {
  console.error('❌ Missing in Dark Mode (dark-mode.css):');
  missingInDark.forEach(t => console.error(`   - ${t}`));
  hasError = true;
}

if (missingInLight.length > 0) {
  console.error('❌ Missing in Light Mode (tokens.css):');
  missingInLight.forEach(t => console.error(`   - ${t}`));
  hasError = true;
}

if (hasError) {
  console.error('\n🚨 Theme Contract Violation! Both light and dark modes must have symmetric token definitions.');
  process.exit(1);
} else {
  console.log('✅ Theme Contract is perfectly mirrored!');
  process.exit(0);
}
