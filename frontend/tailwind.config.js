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
        border: "#E5E7EB",
        input: "#F4F6F5",
        ring: "#1B6440",
        background: "#F8F9FA",
        foreground: "#1A1D1E",
        
        // Kupa-inspired Deep Green & Clean Light Tokens
        brand: {
          green: '#1B6440',
          'green-hover': '#154E30',
          'green-light': '#EBF5F0',
          'green-dark': '#0F3823',
          mint: '#86D6BE',
          charcoal: '#1A1D1E',
          slate: '#334155',
          muted: '#6B7280',
          lightgray: '#F4F6F5',
          border: '#E5E7EB',
          amber: '#F59E0B',
          red: '#EF4444',
          white: '#FFFFFF',
        },

        // Semantic Color System
        'forest-green': {
          DEFAULT: '#1B6440',
          dark: '#154E30',
          light: '#EBF5F0',
          border: '#D1E7DD',
          text: '#1B6440',
        },
        'ochre-amber': {
          DEFAULT: '#F59E0B',
          dark: '#B45309',
          light: '#FEF3C7',
          border: '#FDE68A',
          text: '#B45309',
        },
        'terracotta-red': {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#FEE2E2',
          border: '#FECACA',
          text: '#DC2626',
        },
        'muted-gray': '#6B7280',
        'soft-bg': '#F8F9FA',
        'card-bg': '#FFFFFF',

        primary: {
          DEFAULT: "#1B6440",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F4F6F5",
          foreground: "#1A1D1E",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F4F6F5",
          foreground: "#6B7280",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1D1E",
        },
      },
      borderRadius: {
        '3xl': '24px',
        '2xl': '16px',
        xl: "12px",
        lg: "8px",
        md: "6px",
        sm: "4px",
        full: "9999px",
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'floating': '0 10px 30px rgba(27, 100, 64, 0.12)',
      },
    },
  },
  plugins: [],
}
