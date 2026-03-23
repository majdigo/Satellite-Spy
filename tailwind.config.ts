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
        // ── Military Theme (Satellite-Spy native) ──
        military: {
          green: "#00ff41",
          dark: "#0a0f0a",
          amber: "#ffb000",
          red: "#ff3333",
          blue: "#00b4d8",
          cyan: "#00ffff",
          gray: "#1a1a2e",
        },
        // ── Madgic Truth Layers (shared design system) ──
        truth: {
          observed:  { bg: "#E8F5E9", text: "#2D6A4F", border: "#66BB6A" },  // Bayati — serenity
          computed:  { bg: "#E3F2FD", text: "#1B4965", border: "#42A5F5" },  // Rast — nobility
          estimated: { bg: "#FFF3E0", text: "#E76F51", border: "#FF9800" },  // Hijaz — tension
          user:      { bg: "#FFFDE7", text: "#9B8816", border: "#FDD835" },  // Sikah — reflection
          market:    { bg: "#F3E5F5", text: "#6C567B", border: "#AB47BC" },  // Nahawand — introspection
        },
        // ── System State (consonance → dissonance) ──
        maqam: {
          harmony:    "#A7C957",
          tension:    "#F2CC8F",
          dissonance: "#E63946",
        },
        // ── Surfaces (dark mode primary) ──
        surface: {
          DEFAULT: "#1A1A2E",
          up:      "#16213E",
          down:    "#0F3460",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        prose: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "scan-line": "scanLine 3s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "flicker": "flicker 0.15s infinite",
        // Madgic maqam animations
        "qd-pulse-fast": "qdPulseFast 1s infinite",
        "qd-pulse-slow": "qdPulseSlow 3s infinite",
        "qd-dissonance": "qdDissonance 2s infinite",
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
        // Madgic maqam keyframes
        qdPulseFast: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(231,111,81,0.25)" },
          "50%": { boxShadow: "0 0 8px 2px rgba(231,111,81,0.4)" },
        },
        qdPulseSlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(27,73,101,0.12)" },
          "50%": { boxShadow: "0 0 6px 1px rgba(27,73,101,0.25)" },
        },
        qdDissonance: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(230,57,70,0)" },
          "50%": { boxShadow: "0 0 12px 4px rgba(230,57,70,0.25)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
