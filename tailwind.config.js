/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          strong: 'var(--primary-strong)',
        },
        accent: 'var(--accent)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--info)',
        muted: 'var(--muted)',
        surface: {
          DEFAULT: 'var(--surface)',
          strong: 'var(--surface-strong)',
          subtle: 'rgba(16, 35, 61, 0.03)',
        },
        border: 'var(--border)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
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
        /^(bg|text|border)-(primary|success|warning|danger|info|muted|surface)$/,
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
