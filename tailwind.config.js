/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    {
      pattern: /^(bg|text)-(slate|green|red|blue)-(100|700|800)$/,
    },
  ],
  plugins: [],
}
