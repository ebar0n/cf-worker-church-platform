import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.8' },
        },
      },
      dropShadow: {
        glow: [
          '0 0 10px rgba(255,255,255,0.35)',
          '0 0 20px rgba(255,255,255,0.2)',
          '0 0 30px rgba(255,255,255,0.1)',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
