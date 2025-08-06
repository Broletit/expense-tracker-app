/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
  {
    pattern: /(bg|text|ring)-(red|yellow|purple|pink|blue|green|indigo|gray)-(100|500|600)/,
  },
],

}

