const fs = require('fs');

const globalCSSPath = 'src/styles/global.css';
const globalCSS = fs.readFileSync(globalCSSPath, 'utf8');

// The file has very clear section comments.
// We can use regex or manual string splitting based on headers.

// 1. Extract tokens
const tokensRegex = /\/\* =+[\s\S]+?BRAND TOKENS[\s\S]+?:root \{[\s\S]+?\n\}/;
const tokensMatch = globalCSS.match(tokensRegex);
if (tokensMatch) {
  fs.writeFileSync('src/styles/theme/tokens.css', tokensMatch[0] + '\n');
}

// 2. Extract reset
const resetRegex = /\* \{[\s\S]+?p \{[\s\S]+?\n\}/;
const resetMatch = globalCSS.match(resetRegex);
if (resetMatch) {
  fs.writeFileSync('src/styles/base/reset.css', resetMatch[0] + '\n');
}

// 3. Extract dark mode
const darkRegex = /\/\* =+[\s\S]+?Dark Mode Foundation[\s\S]+?\[data-theme='dark'\] \{[\s\S]+?\n\}/;
const darkMatch = globalCSS.match(darkRegex);
if (darkMatch) {
  fs.writeFileSync('src/styles/theme/dark-mode.css', darkMatch[0] + '\n');
}

// 4. Extract animations
const animRegex = /\/\* =+[\s\S]+?Premium Effects & Animations[\s\S]+?\.live-dot \{[\s\S]+?\n\}/;
const animMatch = globalCSS.match(animRegex);
if (animMatch) {
  fs.writeFileSync('src/styles/base/animations.css', animMatch[0] + '\n');
}

// 5. Extract perm matrix
const permRegex = /\/\* =+[\s\S]+?Permission Matrix & Sticky Bar Styles[\s\S]+?\.perm-search-icon \{[\s\S]+?\n\}/;
const permMatch = globalCSS.match(permRegex);
if (permMatch) {
  fs.writeFileSync('src/styles/components/perm-matrix.css', permMatch[0] + '\n');
}

// Write the new global.css (index)
const newGlobalCSS = `@import 'tailwindcss';
@config "../../tailwind.config.js";
@source "../";

/* Theme & Base */
@import './theme/tokens.css';
@import './theme/dark-mode.css';
@import './base/reset.css';
@import './base/animations.css';

/* Layouts */
@import './layout/app-shell.css';
@import './layout/navigation.css';
@import './layout/header.css';

/* Components */
@import './components/form.css';
@import './components/table.css';
@import './components/badge.css';
@import './components/perm-matrix.css';

/* Specific Views & Vendors */
@import './dashboard-v3.css';
@import './auth.css';

/* Utilities */
@import './utilities/print.css';
`;

fs.writeFileSync('src/styles/global.css', newGlobalCSS);
console.log('Split global.css successfully');
