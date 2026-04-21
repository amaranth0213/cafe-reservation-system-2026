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
          50: "#fdf8f3",
          100: "#f5ece0",
          200: "#e8d5bc",
          300: "#d4b896",
          400: "#c09a72",
          500: "#a67c52",
          600: "#8b6340",
          700: "#714e30",
          800: "#5a3d24",
          900: "#45301b",
        },
        cream: {
          50: "#fdfaf6",
          100: "#faf3e8",
          200: "#f2e4cc",
          300: "#e6d0a8",
          400: "#d9bb84",
          500: "#c9a55e",
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
