/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          600: '#163a5e',
          800: '#092542',
          900: '#083766',
        },
        lightteal: {
          500: '#72A9BE', // Make sure to use strings for hex values
          800: '#1870b8'
        },
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [],
};
