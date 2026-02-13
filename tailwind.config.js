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
        }
      }
    }
  },
  plugins: [],
}