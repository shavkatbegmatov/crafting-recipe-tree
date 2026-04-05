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
          bg: '#0d0b08',
          card: '#1a1610',
          border: '#3a3228',
          hover: '#252018',
          panel: '#141210',
          gold: '#c8a050',
        },
        category: {
          raw: '#8a7a60',
          material: '#4a9a5a',
          item: '#6a8abc',
          module: '#c8a050',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      textColor: {
        skin: {
          base: '#d4c4a0',
          muted: '#8a7a60',
          accent: '#c8a050',
        }
      }
    },
  },
  plugins: [],
}
