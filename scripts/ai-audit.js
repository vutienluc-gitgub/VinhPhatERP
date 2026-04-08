/**
 * AI Audit Script (Level 7 Architecture)
 * 
 * Checks for:
 * 1. Forbidden 'any' usage (Rule clean-code.md)
 * 2. Cross-feature relative imports (Rule follow-project-structure.md)
 * 3. TypeScript errors (tsc --noEmit)
 * 4. ESLint violations
 */

import { execSync } from 'child_process';
import { readFileSync, readdirSync, lstatSync, existsSync } from 'fs';
import { join, resolve, dirname, relative, sep } from 'path';
import { fileURLToPath } from 'url';

const dirName = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(dirName, '..');

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

console.log(`${colors.cyan}🚀 Starting AI Audit (Vinh Phat ERP - Level 7)...${colors.reset}\n`);

let failed = false;

function logStatus(name, success, message = '') {
  const icon = success ? '✅' : '❌';
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${name}${message ? `: ${message}` : ''}${colors.reset}`);
  if (!success) failed = true;
}

// 1. Check for 'any' usage (Rule clean-code.md)
function checkAny() {
  const srcDir = join(ROOT, 'src');
  let anyCount = 0;
  const filesWithAny = [];

  function walk(dir) {
    if (!existsSync(dir)) return;
    const files = readdirSync(dir);
    for (const file of files) {
      const path = join(dir, file);
      if (lstatSync(path).isDirectory()) {
         if (file !== 'node_modules' && file !== '.git') walk(path);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        if (file === 'database.types.ts') continue; // Allowed
        const content = readFileSync(path, 'utf8');
        // Heuristic for 'as any', ': any', '(any)'
        if (/ as any|: any|\(any\)/.test(content)) {
          anyCount++;
          filesWithAny.push(relative(ROOT, path));
        }
      }
    }
  }

  walk(srcDir);
  if (anyCount > 0) {
    logStatus('Type Safety', false, `Found ${anyCount} instances of 'any' in ${filesWithAny.length} files.`);
    filesWithAny.slice(0, 10).forEach(f => console.log(`   - ${f}`));
    if (filesWithAny.length > 10) console.log(`   ... and ${filesWithAny.length - 10} more`);
  } else {
    logStatus('Type Safety', true, 'No forbidden "any" usage found.');
  }
}

// 2. Check for cross-feature relative imports (Rule follow-project-structure.md)
function checkArchitecture() {
  const featuresDir = join(ROOT, 'src', 'features');
  if (!existsSync(featuresDir)) return;

  const features = readdirSync(featuresDir).filter(f => lstatSync(join(featuresDir, f)).isDirectory());
  let crossImportCount = 0;

  features.forEach(feature => {
    const featurePath = join(featuresDir, feature);
    function walk(dir) {
      const files = readdirSync(dir);
      for (const file of files) {
        const path = join(dir, file);
        if (lstatSync(path).isDirectory()) walk(path);
        else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          const content = readFileSync(path, 'utf8');
          const relPathToFeatures = relative(featuresDir, path);
          const currentFeatureName = relPathToFeatures.split(sep)[0];
          
          const matches = content.matchAll(/from ['"](\.\.[^'"]+)['"]/g);
          for (const match of matches) {
            const importPath = match[1];
            const absoluteImportPath = resolve(dir, importPath);
            const relativeToFeatures = relative(featuresDir, absoluteImportPath);
            
            // If the relative path doesn't start with the current feature name directory, it's a cross-import
            if (!relativeToFeatures.startsWith(currentFeatureName + sep) && relativeToFeatures !== currentFeatureName) {
              crossImportCount++;
              console.log(`   ${colors.red}❌ Cross-feature import: ${relative(ROOT, path)} -> ${importPath}${colors.reset}`);
            }
          }
        }
      }
    }
    walk(featurePath);
  });

  if (crossImportCount > 0) {
    logStatus('Architecture', false, `Found ${crossImportCount} cross-feature relative imports.`);
  } else {
    logStatus('Architecture', true, 'Feature isolation looks good.');
  }
}

// 3. TSC and ESLint
async function runStandardChecks() {
  console.log(`\n${colors.blue}📦 Running Standard Quality Checks...${colors.reset}`);
  
  try {
    console.log(`   ${colors.cyan}Running tsc --noEmit...${colors.reset}`);
    execSync('npm run typecheck', { stdio: 'inherit' });
    logStatus('TypeScript', true);
  } catch (e) {
    logStatus('TypeScript', false, 'Found compilation errors.');
  }

  try {
    console.log(`\n   ${colors.cyan}Running eslint...${colors.reset}`);
    execSync('npm run lint', { stdio: 'inherit' });
    logStatus('ESLint', true);
  } catch (e) {
    logStatus('ESLint', false, 'Found linting violations.');
  }
}

async function main() {
  checkAny();
  checkArchitecture();
  await runStandardChecks();

  console.log('\n---');
  if (failed) {
    console.log(`${colors.red}❌ Audit FAILED. Codebase does not meet Level 7 standards.${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ Audit PASSED. Level 7 Architecture is stable.${colors.reset}`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
