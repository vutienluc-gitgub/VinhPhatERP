/**
 * AI Audit Script (Level 9 - Production Ready)
 *
 * Checks:
 * 1. Forbidden 'any'
 * 2. Cross-feature relative imports
 * 3. Business logic risks (ERP)
 * 4. TypeScript errors
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

// ===== CONFIG =====
const ROOT = resolve(process.cwd());

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

let failed = false;

// ===== UTILS =====
function logStatus(name, success, message = "") {
  const icon = success ? "✅" : "❌";
  const color = success ? colors.green : colors.red;
  console.log(`${color}${icon} ${name}${message ? `: ${message}` : ""}${colors.reset}`);
  if (!success) failed = true;
}

function run(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString();
  } catch (e) {
    return e.stdout?.toString() || "";
  }
}

// ===== GET CHANGED FILES =====
function getChangedFiles() {
  const output = run("git diff --cached --name-only");
  return output
    .split("\n")
    .map(f => f.trim())
    .filter(f => f.endsWith(".ts") || f.endsWith(".tsx"))
    .filter(f => f.length > 0);
}

// ===== 1. CHECK ANY =====
function checkAny(files) {
  const anyRegex = /:\s*any\b|as\s+any\b|<any>/;

  let count = 0;
  const badFiles = [];

  for (const file of files) {
    const fullPath = join(ROOT, file);
    if (!existsSync(fullPath)) continue;
    if (file.includes("database.types.ts")) continue;

    const content = readFileSync(fullPath, "utf8");
    if (anyRegex.test(content)) {
      count++;
      badFiles.push(file);
    }
  }

  if (count > 0) {
    logStatus("Type Safety", false, `Found ${count} 'any' usage`);
    badFiles.slice(0, 10).forEach(f => console.log(`   - ${f}`));
  } else {
    logStatus("Type Safety", true);
  }
}

// ===== 2. CHECK ARCHITECTURE =====
function checkArchitecture(files) {
  let count = 0;

  for (const file of files) {
    const fullPath = join(ROOT, file);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, "utf8");
    const matches = content.matchAll(/from ['"]([^'"]+)['"]/g);

    for (const match of matches) {
      const importPath = match[1];
      if (!importPath.startsWith(".")) continue;
      if (importPath.startsWith("../../")) {
        count++;
        console.log(`   ❌ Cross-feature import: ${file} -> ${importPath}`);
      }
    }
  }

  if (count > 0) {
    logStatus("Architecture", false, `Found ${count} cross-feature imports`);
  } else {
    logStatus("Architecture", true);
  }
}

// ===== 3. BUSINESS LOGIC (ERP) =====
function checkBusiness(files) {
  let warnings = 0;

  for (const file of files) {
    const fullPath = join(ROOT, file);
    if (!existsSync(fullPath)) continue;

    const content = readFileSync(fullPath, "utf8");

    // ⚠️ kg vs meter
    if (content.includes("meter") && content.includes("price")) {
      console.log(`   ⚠️ Possible unit mismatch (meter vs price) in ${file}`);
      warnings++;
    }

    // ❌ gọi API trong component
    if (content.includes("useEffect") && content.includes("fetch(")) {
      console.log(`   ❌ API call inside component: ${file}`);
      failed = true;
    }
  }

  if (warnings === 0) {
    logStatus("Business Logic", true);
  } else {
    logStatus("Business Logic", true, `${warnings} warnings`);
  }
}

// ===== 4. TYPESCRIPT =====
function checkTypeScript() {
  console.log(`\n${colors.blue}📦 Running TypeScript check...${colors.reset}`);
  try {
    execSync("npx tsc --noEmit", { stdio: "inherit" });
    logStatus("TypeScript", true);
  } catch {
    logStatus("TypeScript", false);
  }
}

// ===== MAIN =====
async function main() {
  console.log(`${colors.cyan}🚀 AI Audit (Level 9) Starting...${colors.reset}\n`);

  const files = getChangedFiles();

  if (files.length === 0) {
    console.log("⚠️ No changed files");
    process.exit(0);
  }

  console.log(`📂 Checking ${files.length} changed files...\n`);

  checkAny(files);
  checkArchitecture(files);
  checkBusiness(files);
  checkTypeScript();

  console.log("\n---");

  if (failed) {
    console.log(`${colors.red}❌ AUDIT FAILED${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}✅ AUDIT PASSED${colors.reset}`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
