/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        'primary-dark': '#1D4ED8',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        shopee: '#EE4D2D',
        tiktok: '#161722',
      },
    },
  },
  plugins: [],
};
