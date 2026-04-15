/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Brand palette — deep ocean / freediving
        brand: {
          bg: '#0B1C1D',         // main background
          surface: '#122628',    // elevated surface
          card: '#173A35',       // card background
          border: '#1F4A43',     // subtle border
          primary: '#2A7A6F',    // primary action
          'primary-dim': '#1E5A52', // pressed primary
          accent: '#3BBFAD',     // teal accent / highlight
          muted: '#8AACA9',      // muted text / icons
          subtle: '#4A7A74',     // subtle secondary text
        },
        ink: {
          DEFAULT: '#F0F4F4',    // primary text
          secondary: '#A8C4C2',  // secondary text
          muted: '#6B9490',      // muted text
          inverse: '#0B1C1D',    // text on light backgrounds
        },
      },
      fontFamily: {
        sans: ['System'],
      },
      borderRadius: {
        'brand-sm': '8px',
        'brand-md': '12px',
        'brand-lg': '16px',
        'brand-xl': '24px',
      },
    },
  },
  plugins: [],
};
