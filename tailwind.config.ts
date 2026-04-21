import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        matcha: {
          50: "#fefdf9",
          100: "#faf7f0",
          200: "#f3ecdf",
          300: "#e8dece",
          400: "#d9cbb6",
          500: "#c5b298",
          600: "#a89278",
          700: "#856f58",
          800: "#645440",
          900: "#473c2d",
        },
        cream: {
          50: "#fefefe",
          100: "#fdfaf4",
          200: "#f8f2e6",
          300: "#f0e6d0",
          400: "#e5d5b4",
          500: "#d6c094",
        },
      },
      fontFamily: {
        sans: ["Noto Sans JP", "sans-serif"],
        serif: ["Noto Serif JP", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
