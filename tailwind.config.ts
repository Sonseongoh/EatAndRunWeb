import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        mint: {
          50: "#ecfeff",
          100: "#cffafe",
          500: "#14b8a6",
          700: "#0f766e"
        }
      }
    }
  },
  plugins: []
};

export default config;
