/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        node: {
          wall:    '#1e293b',
          start:   '#10b981',
          target:  '#ef4444',
          object:  '#f59e0b',
          visited: '#3b82f6',
          path:    '#fbbf24',
          weight:  '#6366f1',
        },
      },
      keyframes: {
        visitedAnim: {
          '0%':   { transform: 'scale(0.3)', borderRadius: '100%', backgroundColor: '#818cf8' },
          '50%':  { transform: 'scale(1.2)', borderRadius: '25%', backgroundColor: '#6366f1' },
          '100%': { transform: 'scale(1)',   borderRadius: '0%',  backgroundColor: '#3b82f6' },
        },
        pathAnim: {
          '0%':   { transform: 'scale(0.3)', backgroundColor: '#fde68a' },
          '50%':  { transform: 'scale(1.2)', backgroundColor: '#fbbf24' },
          '100%': { transform: 'scale(1)',   backgroundColor: '#f59e0b' },
        },
        wallAnim: {
          '0%':   { transform: 'scale(0.6)' },
          '50%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        pulseSpecial: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.1)' },
        },
      },
      animation: {
        'node-visited': 'visitedAnim 0.5s ease forwards',
        'node-path':    'pathAnim 0.4s ease forwards',
        'node-wall':    'wallAnim 0.15s ease forwards',
        'node-special': 'pulseSpecial 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
