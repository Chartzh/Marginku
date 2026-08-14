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
        border: "#262830",
        input: "#262830",
        ring: "#16a34a",
        background: "#131417",
        foreground: "#f3f4f6",
        
        // Exact tokens from DESIGN.md
        'warm-charcoal': {
          DEFAULT: '#131417',
          base: '#131417',
          card: '#18191e',
          surface: '#121316',
          border: '#262830',
        },
        'forest-green': {
          DEFAULT: '#16a34a',
          dark: '#142e1f',
          border: '#166534',
          text: '#22c55e',
        },
        'ochre-amber': {
          DEFAULT: '#d97706',
          dark: '#3d2612',
          border: '#b45309',
          text: '#fbbf24',
        },
        'terracotta-red': {
          DEFAULT: '#dc2626',
          dark: '#3b181b',
          border: '#b91c1c',
          text: '#f87171',
        },
        'off-white': '#f3f4f6',
        'muted-gray': '#9ca3af',

        primary: {
          DEFAULT: "#16a34a",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#18191e",
          foreground: "#f3f4f6",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#21232a",
          foreground: "#9ca3af",
        },
        card: {
          DEFAULT: "#18191e",
          foreground: "#f3f4f6",
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
