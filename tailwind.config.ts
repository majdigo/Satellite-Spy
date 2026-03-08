import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        military: {
          green: "#00ff41",
          dark: "#0a0f0a",
          amber: "#ffb000",
          red: "#ff3333",
          blue: "#00b4d8",
          cyan: "#00ffff",
          gray: "#1a1a2e",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "scan-line": "scanLine 3s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "flicker": "flicker 0.15s infinite",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.97" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
