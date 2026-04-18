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
          50: "#f2f7f0",
          100: "#e0edda",
          200: "#c2dbb7",
          300: "#97c289",
          400: "#6da45e",
          500: "#4e8842",
          600: "#3c6d33",
          700: "#31572a",
          800: "#294624",
          900: "#233b1f",
        },
        cream: {
          50: "#fdfcf7",
          100: "#faf7ec",
          200: "#f4efd6",
          300: "#ece2b8",
          400: "#e0d095",
          500: "#d4bc72",
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
