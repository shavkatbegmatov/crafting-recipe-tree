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
          deep: '#070509',          // login/welcome chuqur fon
          card: '#1a1610',
          border: '#3a3228',
          'border-hover': '#4a4238',
          hover: '#252018',
          panel: '#141210',
          gold: '#c8a050',
          'gold-bright': '#e8c474', // glow/gradient yuqori nuqtasi
          'gold-dim': '#8a6a2e',    // gradient past nuqtasi
        },
        category: {
          raw: '#8a7a60',
          material: '#4a9a5a',
          item: '#6a8abc',
          module: '#c8a050',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Russo One"', 'Inter', 'sans-serif'], // sarlavhalar — game HUD
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      textColor: {
        skin: {
          base: '#d4c4a0',
          muted: '#8a7a60',
          dark: '#5a4e3a',          // eng past kontrast (bo'sh holatlar, izohlar)
          accent: '#c8a050',
        }
      },
      boxShadow: {
        // Panel chuqurligi — yengil ichki gold yorug'lik + ko'p qatlamli soya
        'panel': 'inset 0 1px 0 rgba(255,184,74,0.05), 0 2px 8px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.32)',
        'panel-hover': 'inset 0 1px 0 rgba(255,184,74,0.12), 0 0 24px rgba(200,160,80,0.12), 0 10px 30px rgba(0,0,0,0.45)',
        // Gold glow — kalit harakatlar (tugma, faol element)
        'glow-gold': '0 0 16px rgba(200,160,80,0.35), inset 0 1px 0 rgba(255,255,255,0.10)',
        'glow-gold-lg': '0 0 34px rgba(200,160,80,0.5), inset 0 1px 0 rgba(255,255,255,0.16)',
        'glow-gold-sm': '0 0 10px rgba(200,160,80,0.28)',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(200,160,80,0.30)' },
          '50%': { boxShadow: '0 0 22px rgba(200,160,80,0.55)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2.4s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
}
