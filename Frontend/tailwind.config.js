/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 50px -20px rgba(15, 23, 42, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', 'Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
