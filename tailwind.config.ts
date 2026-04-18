import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // SI brand-aligned palette
        gold: {
          DEFAULT: "hsl(46, 100%, 50%)",
          dim: "hsl(46, 80%, 42%)",
          glow: "hsla(46, 100%, 50%, 0.18)",
        },
        pitch: {
          50: "#f4faf5",
          100: "#e6f4e9",
          500: "#0f766e",
          600: "#0d5c56",
          700: "#0a4742",
          800: "#082f2c",
          900: "#051917",
        },
        navy: {
          DEFAULT: "#293241",
          light: "#3D5A80",
        },
        burnt: "#EE6C4D",
        cream: {
          50: "#faf9f7",
          100: "#f5f3ef",
          200: "#eae6df",
        },
        confed: {
          uefa: "#1e3a8a",
          conmebol: "#15803d",
          concacaf: "#dc2626",
          afc: "#7c3aed",
          caf: "#f59e0b",
          ofc: "#06b6d4",
        },
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        display: ["'Playfair Display'", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        hover: "0 8px 30px rgba(0,0,0,0.10)",
        glow: "0 0 0 3px hsla(46, 100%, 50%, 0.35)",
      },
      borderRadius: {
        xl: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
