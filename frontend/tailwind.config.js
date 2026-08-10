/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        themePrimary: 'var(--theme-primary)',
        glass: {
          bg: 'rgba(255, 255, 255, 0.45)',
          border: 'rgba(255, 255, 255, 0.25)',
          card: 'rgba(255, 255, 255, 0.65)',
          darkBg: 'rgba(15, 23, 42, 0.75)',
          darkCard: 'rgba(30, 41, 59, 0.7)'
        }
      },
      fontFamily: {
        theme: 'var(--theme-font)'
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px'
      }
    },
  },
  plugins: [],
}
