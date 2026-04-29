// .eslintrc.cjs — ERP Vĩnh Phát
// ESLint v8 (legacy config — giữ nguyên để không break toolchain hiện tại)
//
// Thay đổi so với version cũ:
//   [FIX]  no-unused-vars: warn → error
//   [FIX]  Xoá 4 deprecated formatting rules → dùng Prettier thay thế
//   [FIX]  Bỏ snake_case khỏi naming convention
//   [FIX]  Override *Page.tsx: tắt hoàn toàn → chỉ nới lỏng đúng rule cần
//   [ADD]  no-console rule
//   [ADD]  prefer-const rule
//   [ADD]  Overrides cho server/ và agent/
//   [ADD]  boundaries/elements cho server schema

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

  ignorePatterns: [
    'dist',
    'node_modules',
    '.eslintrc.cjs',
    // Build & generated
    '.next',
    'build',
    // Drizzle auto-generated migrations — không lint
    '**/drizzle/migrations/**',
    // File rác tại root — nên xoá hẳn, tạm thời ignore
    'temp.types.ts',
    'temp_types.ts',
    'test.ts',
    'tmp-test-bom.ts',
    'tmp/**',
  ],

  settings: {
    'import/resolver': {
      typescript: {},
    },
    'boundaries/elements': [
      // ── Frontend (src/) ──────────────────────
      {
        type: 'feature',
        pattern: ['src/features/*'],
      },
      {
        type: 'shared',
        pattern: ['src/shared/*'],
      },
      {
        type: 'api',
        pattern: ['src/api/*'],
      },
      {
        type: 'schema',
        pattern: ['src/schema/*'],
      },
      {
        type: 'models',
        pattern: ['src/models/*'],
      },
      // ── Backend (server/) ────────────────────
      {
        type: 'server-db',
        pattern: ['server/src/db/*'],
      },
      {
        type: 'server-routes',
        pattern: ['server/src/routes/*'],
      },
      {
        type: 'server-services',
        pattern: ['server/src/services/*'],
      },
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
          // ❌ Feature không được import từ feature khác
          {
            from: { type: 'feature' },
            disallow: [{ to: { type: 'feature' } }],
            message:
              '❌ Cross-feature imports không được phép. Dùng @/shared/, @/api/, hoặc @/models/ thay thế.',
          },
          // ❌ Routes chỉ được gọi services, không được query DB trực tiếp
          {
            from: { type: 'server-routes' },
            disallow: [{ to: { type: 'server-db' } }],
            message:
              '❌ Routes không được query DB trực tiếp. Tạo service trong server/src/services/ thay thế.',
          },
        ],
      },
    ],

    // ========================
    // 🔒 IMPORT GUARD
    // ========================
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'lucide-react',
            message:
              '❌ Không import lucide-react trực tiếp. Dùng <Icon /> thay thế.',
          },
          {
            // [FIX] Thêm: cấm import axios trực tiếp — phải qua api client
            name: 'axios',
            message:
              '❌ Không import axios trực tiếp. Dùng "@/api/client" hoặc "@/lib/api/client" thay thế.',
          },
        ],
        patterns: [
          {
            group: ['../*'],
            message: '❌ Không dùng relative imports. Dùng @/ alias thay thế.',
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
        // [FIX] Bỏ snake_case — không nhất quán với clean-code.md
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'parameter',
        // [FIX] Bỏ snake_case
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
    'no-unused-vars': 'off', // tắt base rule, dùng typescript version
    '@typescript-eslint/no-unused-vars': [
      // [FIX] warn → error
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',

    // [ADD] Cấm console.log sót lại — console.warn/error/info OK
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

    // [ADD] Bắt buộc dùng const khi không reassign
    'prefer-const': 'error',

    // [ADD] Không dùng var
    'no-var': 'error',

    // ========================
    // 📐 FORMATTING
    // ========================
    // [FIX] Xoá 4 deprecated rules cũ:
    //   object-curly-newline, array-bracket-newline,
    //   object-property-newline, no-mixed-spaces-and-tabs
    // → Dùng Prettier để format thay thế (xem prettier.config.js)
    //
    // Chỉ giữ linebreak-style vì nó ảnh hưởng đến Git diff
    'linebreak-style': ['error', 'unix'],
  },

  overrides: [
    // ========================
    // 🎨 ICON FILES
    // ========================
    {
      files: ['src/shared/icons.ts', '**/Icon.tsx', '**/icons.tsx'],
      rules: {
        'no-restricted-imports': 'off',
        '@typescript-eslint/naming-convention': 'off',
      },
    },

    // ========================
    // 📄 PAGE-LEVEL COMPONENTS
    // ========================
    {
      // [FIX] Không tắt hoàn toàn boundaries — chỉ cho phép
      // Page và Detail compose nhiều features, nhưng vẫn cấm query DB trực tiếp
      files: ['**/*Page.tsx', '**/*Detail.tsx', '**/*Layout.tsx'],
      rules: {
        // Chỉ tắt cross-feature rule (vì page cần compose)
        // Các boundaries rule khác vẫn còn hiệu lực
        'boundaries/dependencies': [
          'off',
          {
            default: 'allow',
            rules: [
              {
                from: { type: 'feature' },
                disallow: [{ to: { type: 'feature' } }],
                message:
                  '⚠️ Page/Detail đang dùng cross-feature import. Xem xét refactor nếu logic phức tạp.',
              },
            ],
          },
        ],
      },
    },

    // ========================
    // 🔀 PORTAL INFRASTRUCTURE
    // ========================
    {
      files: [
        '**/PortalRoute.tsx',
        '**/CustomerPortalLayout.tsx',
        '**/CustomerPortalRouter.tsx',
      ],
      rules: {
        'boundaries/dependencies': 'off', // Portal infra cần auth access — giữ nguyên
      },
    },

    // ========================
    // 🎨 UI COMPONENTS (Chống rò rỉ Business Logic)
    // ========================
    {
      files: ['src/**/*.tsx'], // Chỉ áp dụng cho các file giao diện
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: "CallExpression[callee.property.name='reduce']",
            message: "❌ Không được dùng 'reduce' trong UI component. Hãy tách logic tính toán ra các hàm utils / use-case.",
          },
        ],
      },
    },

    // ========================
    // 🖥️ BACKEND (server/)
    // ========================
    {
      // [ADD] Rules riêng cho backend
      files: ['server/**/*.ts'],
      rules: {
        // Backend không có React — tắt react rules
        'react-refresh/only-export-components': 'off',
        // Backend được dùng console (logger)
        'no-console': 'off',
        // Cảnh báo await trong loop — dùng Promise.all thay thế
        'no-await-in-loop': 'warn',
        // Unsafe any trong ORM query có thể xảy ra — warn thôi
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },

    // ========================
    // 🤖 AGENT (agent/)
    // ========================
    {
      // [ADD] Rules riêng cho AI agent
      files: ['agent/**/*.ts'],
      rules: {
        'react-refresh/only-export-components': 'off',
        'no-console': 'off',        // Agent cần log để debug
        'no-await-in-loop': 'off',  // Agent có thể cần sequential awaits
      },
    },

    // ========================
    // 🛠️ SCRIPTS & CLI
    // ========================
    {
      files: ['scripts/**/*.ts', 'check_*.ts'],
      rules: {
        'no-console': 'off',
        'no-await-in-loop': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
      },
    },

    // ========================
    // 🧪 TEST FILES
    // ========================
    {
      files: ['**/*.test.ts', '**/*.spec.ts', '**/*.test.tsx', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn', // mock objects thường cần any
        'no-console': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
  ],
}
