/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#667eea',
          600: '#5c6bc0',
          700: '#5159a8',
          800: '#4a5090',
          900: '#3d4278',
        },
        secondary: {
          50: '#f5f0ff',
          100: '#ede5ff',
          200: '#d5c4ff',
          300: '#b69dff',
          400: '#9f75ff',
          500: '#764ba2',
          600: '#6a3d93',
          700: '#5e3384',
          800: '#522975',
          900: '#461f66',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
