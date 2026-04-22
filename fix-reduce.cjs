const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project({
  tsConfigFilePath: 'tsconfig.app.json',
});

const files = fs.readFileSync('lint_output.txt', 'utf16le')
  .split('\n')
  .map(l => {
    const m = l.match(/^([A-Z]:\\[^\n]+)/);
    return m ? m[1].trim() : null;
  })
  .filter(Boolean);

const uniqueFiles = Array.from(new Set(files));

for (const filePath of uniqueFiles) {
  const sourceFile = project.getSourceFile(filePath);
  if (!sourceFile) continue;

  let modified = false;
  let importAdded = false;

  const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (let i = callExprs.length - 1; i >= 0; i--) {
    const callExpr = callExprs[i];
    const expr = callExpr.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr;
      if (propAccess.getName() === 'reduce') {
        const args = callExpr.getArguments();
        if (args.length >= 1) {
          const callback = args[0];
          if (callback.getKind() === SyntaxKind.ArrowFunction) {
            const params = callback.getParameters();
            if (params.length === 2) {
              const [acc, curr] = params;
              const accName = acc.getName();
              const currName = curr.getName();
              
              const body = callback.getBody();
              if (body.getKind() === SyntaxKind.Block) continue;
              
              const bodyText = body.getText();
              const arrayExpr = propAccess.getExpression();
              const arrayText = arrayExpr.getText();
              
              if (bodyText.includes(accName + ' +') || bodyText.includes('+ ' + accName) || bodyText.includes(accName + '+') || bodyText.includes('+' + accName)) {
                let iterateeBody = bodyText.replace(accName + ' +', '').replace('+ ' + accName, '').replace(accName + '+', '').replace('+' + accName, '').trim();
                if (iterateeBody.startsWith('(') && iterateeBody.endsWith(')')) {
                    iterateeBody = iterateeBody.substring(1, iterateeBody.length - 1);
                }
                
                const newCall = 'sumBy(' + arrayText + ', ' + currName + ' => ' + iterateeBody + ')';
                callExpr.replaceWithText(newCall);
                modified = true;
                importAdded = true;
              }
            }
          }
        }
      }
    }
  }

  if (importAdded) {
    const imports = sourceFile.getImportDeclarations();
    const hasImport = imports.some(i => i.getModuleSpecifierValue() === '@/shared/utils/array.util');
    if (!hasImport) {
        sourceFile.addImportDeclaration({
          moduleSpecifier: '@/shared/utils/array.util',
          namedImports: ['sumBy']
        });
    }
  }

  if (modified) {
    sourceFile.saveSync();
    console.log('Fixed:', filePath);
  }
}
