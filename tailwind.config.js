/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apolus-blue': '#2c4b98',
        'apolus-gray': '#808182',
        'apolus-white': '#fdfffc',
      }
    },
  },
  plugins: [],
}
