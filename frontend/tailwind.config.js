/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We will force dark mode or toggle it
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#0C0C0E",
          panel: "#121216",
          node: "#1A1A22",
          border: "#2A2A35",
          neon: "#D4FF3A", // neon green-yellow
          neonDim: "rgba(212, 255, 58, 0.15)",
          text: "#E2E8F0",
          muted: "#94A3B8"
        }
      },
      boxShadow: {
        'neon-glow': '0 0 15px rgba(212, 255, 58, 0.45)',
        'neon-glow-lg': '0 0 25px rgba(212, 255, 58, 0.65)',
        'panel-glow': '0 0 10px rgba(0, 0, 0, 0.5)'
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
