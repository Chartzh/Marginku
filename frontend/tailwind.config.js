/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      colors: {
        border: "#3f4945",
        input: "#3f4945",
        ring: "#10B981",
        background: "#121816",
        foreground: "#e0e3e0",
        
        charcoal: "#121816",
        'teal-slate': "#1B2724",
        emerald: "#10B981",
        'accent-yellow': "#FBE045",
        'crimson-red': "#DC2626",
        'modal-bg': "#1B2724",
        'modal-input-bg': "#121816",
        'outline-variant': "#3f4945",

        // Exact tokens from DESIGN.md (updated to Stitch palette)
        'warm-charcoal': {
          DEFAULT: '#121816',
          base: '#121816',
          card: '#1B2724',
          surface: '#101413',
          border: '#3f4945',
        },
        'forest-green': {
          DEFAULT: '#10B981',
          dark: '#046754',
          border: '#046754',
          text: '#10B981',
        },
        'ochre-amber': {
          DEFAULT: '#FBE045',
          dark: '#3d2612',
          border: '#c3ab00',
          text: '#FBE045',
        },
        'terracotta-red': {
          DEFAULT: '#DC2626',
          dark: '#3b181b',
          border: '#93000a',
          text: '#ffb4ab',
        },
        'off-white': '#e0e3e0',
        'muted-gray': '#bec9c4',

        primary: {
          DEFAULT: "#10B981",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#1B2724",
          foreground: "#e0e3e0",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#1c201f",
          foreground: "#bec9c4",
        },
        card: {
          DEFAULT: "#1B2724",
          foreground: "#e0e3e0",
        },
      },
      borderRadius: {
        xl: "12px",
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
    },
  },
  plugins: [],
}
