/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rose: {
          gold: {
            50: "#FBF7F2",
            100: "#F6EDE2",
            200: "#EDDAC4",
            300: "#E2C29E",
            400: "#D4A574",
            500: "#C8965F",
            600: "#B8956E",
            700: "#9A7A57",
            800: "#7D6347",
            900: "#66513B",
          },
        },
        ink: {
          DEFAULT: "#1E2A4A",
          light: "#2E3D66",
          soft: "#4A5A82",
        },
        peach: {
          DEFAULT: "#FFE5E0",
          soft: "#FFF2EF",
          deep: "#FFCFC5",
        },
        coral: {
          DEFAULT: "#FF6B6B",
          soft: "#FFE8E8",
        },
        mint: {
          DEFAULT: "#4ECDC4",
          soft: "#E5F9F7",
        },
        cream: {
          DEFAULT: "#FFFAF7",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "serif"],
        sans: ['"PingFang SC"', '"Microsoft YaHei"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(30, 42, 74, 0.06)",
        "card-hover": "0 10px 40px rgba(30, 42, 74, 0.10)",
        glow: "0 0 24px rgba(212, 165, 116, 0.35)",
        "coral-pulse": "0 0 0 0 rgba(255, 107, 107, 0.7)",
      },
      animation: {
        "pulse-border": "pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-breath": "glow-breath 3s ease-in-out infinite",
        "float-in": "float-in 0.5s ease-out",
      },
      keyframes: {
        "pulse-border": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,107,107,0.5)" },
          "50%": { boxShadow: "0 0 0 8px rgba(255,107,107,0)" },
        },
        "glow-breath": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(212,165,116,0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(212,165,116,0.5)" },
        },
        "float-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      backgroundImage: {
        "rose-gold-gradient": "linear-gradient(135deg, #D4A574 0%, #B8956E 100%)",
        "rose-gold-soft": "linear-gradient(135deg, #F6EDE2 0%, #E2C29E 100%)",
      },
    },
  },
  plugins: [],
};
