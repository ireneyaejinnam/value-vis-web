/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6363E1',
        'primary-dark': '#4a4ab8',
        'primary-light': 'rgba(99,99,225,0.12)',
        bg: '#F3F6F6',
        surface: '#FFFFFF',
        'surface-2': '#EEF1F5',
        border: '#E2E4EC',
        'text-primary': '#0D0D1A',
        'text-secondary': 'rgba(57,55,55,0.72)',
        'text-muted': '#9499AA',
        lavender: '#a59ee9',
        coral: '#E89A7A',
        'task-blue': '#7A9AE8',
        mint: '#7AE8D0',
        'task-purple': '#B87AE8',
        pink: '#E87AB8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

