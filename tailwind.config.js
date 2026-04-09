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
      pattern: /^(bg|text)-(slate|green|red|blue)-(100|700|800)$/,
    },
  ],
  plugins: [],
};
