import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#145231',
        },
        surface: {
          DEFAULT: '#111827',
          light: '#1F2937',
          lighter: '#374151',
        },
        background: '#0A0F1C',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'confetti': {
          '0%': {
            opacity: '1',
            transform: 'translateY(0px) rotate(0deg)',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(500px) rotate(360deg)',
          },
        },
        'progress': {
          '0%': { width: '0%', opacity: '1' },
          '80%': { width: '90%', opacity: '1' },
          '100%': { width: '100%', opacity: '0.6' },
        },
        // Bola rolando: gira 360° enquanto oscila para os lados
        'ball-spin': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'ball-roll': {
          '0%':   { transform: 'translateX(-28px) rotate(0deg)' },
          '50%':  { transform: 'translateX(28px)  rotate(360deg)' },
          '100%': { transform: 'translateX(-28px) rotate(720deg)' },
        },
        'nav-bar': {
          '0%':   { width: '0%',   opacity: '1' },
          '50%':  { width: '70%',  opacity: '1' },
          '90%':  { width: '95%',  opacity: '1' },
          '100%': { width: '100%', opacity: '0' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        confetti: 'confetti 2.5s ease-out forwards',
        progress: 'progress 4s ease-in-out forwards',
        'ball-spin': 'ball-spin 0.7s linear infinite',
        'ball-roll': 'ball-roll 1.2s ease-in-out infinite',
        'nav-bar':   'nav-bar 3s ease-in-out forwards',
        'fade-in':   'fade-in 0.2s ease-out forwards',
        'fade-out':  'fade-out 0.2s ease-in forwards',
      },
    },
  },
  plugins: [],
};

export default config;
