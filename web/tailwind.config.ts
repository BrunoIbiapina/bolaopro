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
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        confetti: 'confetti 2.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
