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
        builder: {
          bg: "#09090b",
          surface: "#121215",
          card: "#141418",
          border: "#27272a",
          text: "#f4f4f5",
          muted: "#a1a1aa",
          primary: "#6366f1",
          primaryHover: "#4f46e5",
          light: {
            bg: "#fafafa",
            surface: "#ffffff",
            card: "#ffffff",
            border: "#e4e4e7",
            text: "#09090b",
            muted: "#71717a",
            primary: "#4f46e5",
            primaryHover: "#4338ca",
          }
        },
        cyber: {
          dark: "#09090b",
          panel: "#121215",
          node: "#141418",
          border: "#27272a",
          neon: "#6366f1",
          neonDim: "rgba(99, 26, 255, 0.12)",
          text: "#f4f4f5",
          muted: "#a1a1aa"
        },
        clay: {
          bg: "#09090b",
          card: "#141418",
          primary: "#6366f1",
          primaryHover: "#4f46e5",
          sidebar: "#101014",
          border: "#27272a",
          inset: "#18181b",
          text: "#f4f4f5",
          sub: "#a1a1aa"
        }
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'builder-card': '0 1px 3px 0 rgba(0, 0, 0, 0.2)',
        'clay-card': '0 1px 3px 0 rgba(0, 0, 0, 0.2)',
        'clay-button': '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        'clay-inset': 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
        'neon-glow': '0 0 15px rgba(99, 102, 241, 0.25)',
        'neon-glow-lg': '0 0 25px rgba(99, 102, 241, 0.35)',
        'panel-glow': '0 4px 12px -2px rgba(0, 0, 0, 0.25)'
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
