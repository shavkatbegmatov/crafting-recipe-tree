/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F1117',
          card: '#1A1D27',
          border: '#2A2D37',
          hover: '#252833',
        },
        category: {
          raw: '#6B7280',
          material: '#10B981',
          item: '#3B82F6',
          module: '#F59E0B',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
