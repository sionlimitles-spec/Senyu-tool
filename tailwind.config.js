/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      colors: {
        paper: '#F0EDE5', ink: '#0A0A0A',
        yellow: '#FFE500', pink: '#FF2E88', cyan: '#00E5FF',
        acid: '#D4FF00', blood: '#FF3B30',
      },
      fontFamily: {
        display: ['"Anton"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
        marker: ['"Permanent Marker"', 'cursive'],
      },
      boxShadow: {
        'brutal': '4px 4px 0px 0px #0A0A0A',
        'brutal-lg': '8px 8px 0px 0px #0A0A0A',
        'brutal-sm': '2px 2px 0px 0px #0A0A0A',
        'brutal-yellow': '6px 6px 0px 0px #FFE500',
      },
      borderWidth: { '3': '3px', '4': '4px' },
    },
  },
  plugins: [],
};
