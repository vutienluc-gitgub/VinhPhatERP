const { ESLint } = require('eslint');

(async function() {
  const eslint = new ESLint({
    overrideConfig: {
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'Literal[value=/[\\p{Extended_Pictographic}]/u]',
            message: 'No emoji'
          },
          {
            selector: 'JSXText[value=/[\\p{Extended_Pictographic}]/u]',
            message: 'No emoji'
          },
          {
            selector: 'TemplateElement[value.raw=/[\\p{Extended_Pictographic}]/u]',
            message: 'No emoji'
          }
        ]
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: { jsx: true }
      }
    },
    useEslintrc: false
  });

  const res = await eslint.lintText('const a = "📦"; const b = `🔴 ${1}`; const c = <div>🤷🏽‍♂️</div>;');
  console.log(JSON.stringify(res[0].messages, null, 2));
})().catch(console.error);
