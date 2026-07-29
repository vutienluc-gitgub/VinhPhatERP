/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        card: 'var(--card)',
        primary: {
          DEFAULT: 'var(--primary)',
          strong: 'var(--primary-strong)',
          hover: 'var(--primary-hover)',
        },
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        brand: {
          zalo: 'rgba(var(--brand-zalo-rgb), <alpha-value>)',
        },
        success: {
          DEFAULT: 'var(--success)',
          strong: 'var(--success-strong)',
          soft: 'var(--success-soft)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          strong: 'var(--danger-strong)',
          soft: 'var(--danger-soft)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          strong: 'var(--warning-strong)',
          soft: 'var(--warning-soft)',
        },
        info: {
          DEFAULT: 'var(--info)',
          strong: 'var(--info-strong)',
          soft: 'var(--info-soft)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--text-muted-foreground)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          secondary: 'var(--surface-secondary)',
          strong: 'var(--surface-strong)',
          subtle: 'var(--surface-subtle)',
          hover: 'var(--surface-hover)',
          selected: 'var(--surface-selected)',
          disabled: 'var(--surface-disabled)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
          muted: 'var(--border-muted)',
          focus: 'var(--border-focus)',
          danger: 'var(--border-danger)',
        },
        input: {
          DEFAULT: 'var(--input)',
          border: 'var(--input-border)',
          focus: 'var(--input-focus-ring)',
        },
        label: 'var(--text-label)',
        foreground: 'var(--foreground)',
        link: 'var(--link)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
      },
    },
  },
  safelist: [
    {
      pattern:
        /^(bg|text|border|ring)-(slate|gray|red|orange|amber|yellow|green|emerald|teal|blue|indigo|purple|pink)-(50|100|200|300|400|500|600|700|800|900)$/,
      variants: ['hover', 'focus', 'active', 'group-hover'],
    },
    {
      pattern:
        /^(bg|text|border)-(primary|secondary|accent|success|warning|danger|info|muted|surface|background|card|foreground)(-[a-z]+)?$/,
      variants: ['hover', 'focus', 'active', 'group-hover'],
    },
    'bg-[var(--surface-subtle)]',
    'text-[var(--text)]',
    'gap-1',
    'gap-1.5',
    'gap-2',
    'gap-2.5',
    'gap-3',
    'gap-4',
    'gap-5',
    'gap-6',
    'p-1',
    'p-1.5',
    'p-2',
    'p-2.5',
    'p-3',
    'p-4',
    'p-5',
    'p-6',
  ],
  plugins: [],
};
