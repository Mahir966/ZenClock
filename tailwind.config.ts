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
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      keyframes: {
        'alarm-flash': {
          '0%, 100%': { backgroundColor: '#ef4444' },
          '50%': { backgroundColor: '#ffffff' },
        },
        'alarm-flash-subtle': {
          '0%, 100%': { opacity: '0.9' },
          '50%': { opacity: '0.1' },
        },
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.05)', opacity: '0.9' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
      },
      animation: {
        'alarm-flash': 'alarm-flash 0.6s infinite ease-in-out',
        'alarm-flash-subtle': 'alarm-flash-subtle 0.6s infinite ease-in-out',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'zen-breathe': 'breathe 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
