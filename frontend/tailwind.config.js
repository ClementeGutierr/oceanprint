/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          deepest: '#020c1b',
          deep: '#0a1628',
          mid: '#0d2137',
          surface: '#122944',
          teal: '#0077b6',
          cyan: '#00b4d8',
          light: '#48cae4',
          foam: '#90e0ef',
          mist: '#caf0f8',
        },
        coral: {
          DEFAULT: '#ff6b6b',
          dark: '#ee4444',
        },
        sand: {
          DEFAULT: '#ffd166',
          light: '#ffe8a3',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bubble': 'bubble 8s ease-in infinite',
        'bubble-slow': 'bubble 12s ease-in infinite',
        'bubble-fast': 'bubble 5s ease-in infinite',
        'wave': 'wave 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'confetti': 'confetti 1s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        bubble: {
          '0%': { transform: 'translateY(100%) scale(0)', opacity: '0' },
          '10%': { opacity: '0.7' },
          '90%': { opacity: '0.3' },
          '100%': { transform: 'translateY(-100vh) scale(1.5)', opacity: '0' },
        },
        wave: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-5%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(0,180,216,0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0,180,216,0.8), 0 0 60px rgba(0,180,216,0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        confetti: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(720deg)', opacity: '0' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
