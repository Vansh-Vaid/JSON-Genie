/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: 'var(--ink)', canvas: 'var(--canvas)', line: 'var(--line)', validate: 'var(--validate)', flag: 'var(--flag)', error: 'var(--error)' },
      fontFamily: { sans: ['IBM Plex Sans', 'sans-serif'], mono: ['IBM Plex Mono', 'monospace'] },
    },
  },
  plugins: [],
}
