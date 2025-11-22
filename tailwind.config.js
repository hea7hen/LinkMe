/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        swissRed: '#E53935',
        surface: '#F7F7F7',
        textPrimary: '#0B0B0B',
        textMuted: '#6B7280',
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', '"Neue Haas Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [],
}

