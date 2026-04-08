module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],

  parser: '@typescript-eslint/parser',

  plugins: ['@typescript-eslint', 'react-refresh', 'import', 'boundaries'],

  ignorePatterns: ['dist', 'node_modules'],

  settings: {
    'import/resolver': {
      typescript: {},
    },
    'boundaries/elements': [
      { type: 'feature', pattern: 'src/features/*' },
      { type: 'shared', pattern: 'src/shared/*' },
      { type: 'api', pattern: 'src/api/*' },
      { type: 'schema', pattern: 'src/schema/*' },
      { type: 'models', pattern: 'src/models/*' },
    ],
  },

  rules: {
    // ========================
    // 🏗️ ARCHITECTURE BOUNDARIES
    // ========================
    'boundaries/dependencies': [
      'error',
      {
        default: 'allow',
        rules: [
          {
            from: ['feature'],
            disallow: ['feature'],
            message:
              'Cross-feature imports are not allowed. Use @/shared/, @/api/, or @/models/ instead.',
          },
        ],
      },
    ],

    // ========================
    // 🔒 IMPORT GUARD (ICON + STRUCTURE)
    // ========================
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'lucide-react',
            message:
              '❌ Do not import lucide-react directly. Use <Icon /> instead.',
          },
        ],
        patterns: [
          {
            group: ['../*'],
            message: '❌ Do not use relative imports. Use @/ alias instead.',
          },
        ],
      },
    ],

    // ========================
    // 📦 IMPORT ORDER
    // ========================
    'import/order': [
      'warn',
      {
        groups: ['builtin', 'external', 'internal'],
        'newlines-between': 'always',
      },
    ],

    // ========================
    // 🧠 NAMING CONVENTION
    // ========================
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'variableLike',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'parameter',
        format: ['camelCase', 'PascalCase'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
    ],

    // ========================
    // ⚛️ REACT FAST REFRESH
    // ========================
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // ========================
    // 🧼 CLEAN CODE
    // ========================
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',

    // ========================
    // 📐 VERTICAL FORMATTING (Trick tránh lỗi ngoặc)
    // ========================
    'linebreak-style': ['error', 'unix'],
    'object-curly-newline': ['warn', { multiline: true, consistent: true }],
    'array-bracket-newline': ['warn', { multiline: true }],
    'object-property-newline': [
      'warn',
      { allowAllPropertiesOnSameLine: false },
    ],
  },

  // ========================
  // 🎯 OVERRIDE (Icon-related files)
  // ========================
  overrides: [
    {
      files: ['src/shared/icons.ts', '**/Icon.tsx', '**/icons.tsx'],
      rules: {
        'no-restricted-imports': 'off',
        '@typescript-eslint/naming-convention': 'off',
      },
    },
    {
      // Page-level orchestrators may compose multiple features
      files: ['**/*Page.tsx', '**/*Detail.tsx'],
      rules: {
        'boundaries/dependencies': 'off',
      },
    },
  ],
};
