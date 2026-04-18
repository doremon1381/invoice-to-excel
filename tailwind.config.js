/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        light: {
          background: '#fff',
          text: '#11181C',
          tint: '#0a7ea4',
          icon: '#687076',
          card: '#F5F7FA',
          border: '#D9E2EC',
          muted: '#52606D',
          danger: '#D64545',
          success: '#127A4D',
          warning: '#B26A00',
        },
        dark: {
          background: '#151718',
          text: '#ECEDEE',
          tint: '#fff',
          icon: '#9BA1A6',
          card: '#1E232A',
          border: '#2D3640',
          muted: '#9BA1A6',
          danger: '#FF7B72',
          success: '#3FB950',
          warning: '#D29922',
        },
      },
    },
  },
  plugins: [],
};
