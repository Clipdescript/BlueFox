/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gx: {
          bg: '#ffffff',          // White background
          sidebar: '#f3f3f3',     // Light grey sidebar
          accent: '#fa1e4e',      // Keep the red accent (GX identity)
          hover: '#e5e5e5',       // Light grey hover
          card: '#ffffff',        // White cards
          text: '#000000',        // Black text
          textSec: '#666666'      // Secondary text
        }
      }
    },
  },
  plugins: [],
}
