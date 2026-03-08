/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        panocef: {
          primary: '#1F4391',
          secondary: '#2F4093',
          accent: '#2AD2C1',
          light: '#F4FCFD',
          dark: '#1D2864',
        },
        // Aliases para compatibilidad con clases existentes
        clinic: {
          primary: '#1F4391',
          secondary: '#2F4093',
          accent: '#2AD2C1',
          light: '#F4FCFD',
          dark: '#1D2864',
        },
        laboratory: {
          primary: '#2F4093',
          secondary: '#2AD2C1',
          accent: '#94A3D3',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
