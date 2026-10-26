/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: "#F0F4F9",
          panel: "#FFFFFF",
          node: "#FFFFFF",
          border: "#E2E8F0",
          neon: "#1A6AFF", // vibrant royal blue
          neonDim: "rgba(26, 106, 255, 0.12)",
          text: "#1E293B",
          muted: "#64748B"
        },
        clay: {
          bg: "#F0F4F9",
          card: "#FFFFFF",
          primary: "#1A6AFF",
          primaryHover: "#1658DB",
          sidebar: "#1A6AFF",
          border: "#E2E8F0",
          inset: "#F1F5F9",
          text: "#1E293B",
          sub: "#64748B"
        }
      },
      boxShadow: {
        'clay-card': '0 12px 30px -4px rgba(24, 62, 120, 0.08), 0 4px 12px rgba(24, 62, 120, 0.04)',
        'clay-button': '0 8px 20px -2px rgba(26, 106, 255, 0.38)',
        'clay-inset': 'inset 0 2px 6px rgba(0, 0, 0, 0.05), inset 0 1px 2px rgba(0, 0, 0, 0.08)',
        'neon-glow': '0 0 15px rgba(26, 106, 255, 0.35)',
        'neon-glow-lg': '0 0 25px rgba(26, 106, 255, 0.5)',
        'panel-glow': '0 10px 25px -4px rgba(24, 62, 120, 0.08)'
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

