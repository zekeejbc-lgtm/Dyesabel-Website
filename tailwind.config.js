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
        ocean: {
          dark: '#00080a',
          deep: '#051923',
          light: '#e0f2f1',
          mint: '#80cbc4',
        },
        primary: {
          cyan: '#22d3ee',
          blue: '#2563eb',
        },
        accent: {
          rose: '#f43f5e',
          pink: '#db2777',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        lobster: ['Lobster', 'cursive'],
      },
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'rise': 'rise 15s infinite linear',
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pop-in': 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        rise: {
          '0%': { bottom: '-50px', transform: 'translateX(0)', opacity: '0' },
          '10%': { opacity: '0.6' },
          '50%': { transform: 'translateX(20px)', opacity: '0.4' },
          '100%': { bottom: '110%', transform: 'translateX(-20px)', opacity: '0' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.9) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    }
  },
  plugins: [],
}