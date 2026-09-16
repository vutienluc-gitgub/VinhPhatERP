const { Project, SyntaxKind } = require('ts-morph');

const project = new Project({
  tsConfigFilePath: 'tsconfig.app.json',
});

const sourceFiles = project.getSourceFiles('src/application/**/*.ts');
let modifiedCount = 0;

for (const sourceFile of sourceFiles) {
  let modified = false;

  const functions = sourceFile.getFunctions();
  for (const fn of functions) {
    const name = fn.getName();
    if (name && name.startsWith('useCreate')) {
      const returnStmt = fn.getStatementByKind(SyntaxKind.ReturnStatement);
      if (!returnStmt) continue;

      const callExpr = returnStmt.getExpressionIfKind(SyntaxKind.CallExpression);
      if (!callExpr || callExpr.getExpression().getText() !== 'useMutation') continue;

      const args = callExpr.getArguments();
      if (args.length === 0) continue;
      const configObj = args[0].asKind(SyntaxKind.ObjectLiteralExpression);
      if (!configObj) continue;

      // Skip if already patched
      if (fn.getText().includes('clientId')) continue;

      // Ensure useState is imported
      const imports = sourceFile.getImportDeclarations();
      const reactImport = imports.find(i => i.getModuleSpecifierValue() === 'react');
      if (reactImport) {
        if (!reactImport.getNamedImports().some(ni => ni.getName() === 'useState')) {
          reactImport.addNamedImport('useState');
        }
      } else {
        sourceFile.addImportDeclaration({
          namedImports: ['useState'],
          moduleSpecifier: 'react',
        });
      }

      // Modify mutationFn
      let didModifyFn = false;
      const mutationFnProp = configObj.getProperty('mutationFn');
      if (mutationFnProp && mutationFnProp.isKind(SyntaxKind.PropertyAssignment)) {
        const initializer = mutationFnProp.getInitializer();
        if (initializer && initializer.isKind(SyntaxKind.ArrowFunction)) {
          const body = initializer.getBody();
          if (body.isKind(SyntaxKind.CallExpression)) {
            const apiCallText = body.getText();
            const apiName = body.getExpression().getText();
            const apiArgs = body.getArguments().map(a => a.getText());
            
            if (apiArgs.length > 0) {
              const firstArg = apiArgs[0];
              const restArgs = apiArgs.slice(1).join(', ');
              const paramText = initializer.getParameters().map(p => p.getText()).join(', ');
              
              const newArrowFunc = `(${paramText}) => {\n      const reqPayload = { id: clientId, ...(${firstArg}) };\n      return ${apiName}(reqPayload as any${restArgs ? ', ' + restArgs : ''});\n    }`;
              initializer.replaceWithText(newArrowFunc);
              didModifyFn = true;
            }
          }
        }
      }

      if (didModifyFn) {
        // Insert const [clientId, setClientId] = useState(() => crypto.randomUUID());
        fn.insertStatements(0, 'const [clientId, setClientId] = useState(() => crypto.randomUUID());');

        // Modify onSuccess
        const onSuccessProp = configObj.getProperty('onSuccess');
        if (onSuccessProp && onSuccessProp.isKind(SyntaxKind.PropertyAssignment)) {
          const initializer = onSuccessProp.getInitializer();
          if (initializer && initializer.isKind(SyntaxKind.ArrowFunction)) {
            const body = initializer.getBody();
            if (body.isKind(SyntaxKind.Block)) {
              if (!body.getText().includes('setClientId')) {
                 body.asKind(SyntaxKind.Block).insertStatements(0, 'setClientId(crypto.randomUUID());');
              }
            } else if (body.isKind(SyntaxKind.CallExpression) || body.isKind(SyntaxKind.VoidExpression)) {
              // Convert concise body to block
              const paramText = initializer.getParameters().map(p => p.getText()).join(', ');
              const newArrowFunc = `(${paramText}) => {\n      setClientId(crypto.randomUUID());\n      return ${body.getText()};\n    }`;
              initializer.replaceWithText(newArrowFunc);
            }
          }
        } else if (!onSuccessProp) {
           // Add onSuccess if not present
           configObj.addPropertyAssignment({
             name: 'onSuccess',
             initializer: '() => { setClientId(crypto.randomUUID()); }'
           });
        }
        modified = true;
      }
    }
  }

  if (modified) {
    sourceFile.saveSync();
    modifiedCount++;
    console.log(`Patched: ${sourceFile.getFilePath()}`);
  }
}

console.log(`Total files modified: ${modifiedCount}`);
