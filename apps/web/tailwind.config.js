/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FAF8F5',
        ink: {
          DEFAULT: '#141413',
          muted: '#63625E',
          light: '#8F8E8A',
        },
        border: '#E4E2DD',
        coral: {
          DEFAULT: '#EA580C',
          hover: '#C2410C',
          light: '#FFEDD5',
        },
        cobalt: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#DBEAFE',
        },
        bento: {
          peach: '#FFF7ED',
          mint: '#ECFDF5',
          sky: '#EFF6FF',
          lavender: '#F5F3FF',
        },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        studio: '14px',
      },
      boxShadow: {
        tactile: '0 1px 3px rgba(20, 20, 19, 0.05), 0 1px 2px rgba(20, 20, 19, 0.03)',
        'tactile-md': '0 4px 6px -1px rgba(20, 20, 19, 0.06), 0 2px 4px -2px rgba(20, 20, 19, 0.04)',
        'tactile-lg': '0 10px 15px -3px rgba(20, 20, 19, 0.08), 0 4px 6px -4px rgba(20, 20, 19, 0.03)',
      },
    },
  },
  plugins: [],
};

