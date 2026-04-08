import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C2703E',
        secondary: '#2D5F3A',
        bg: '#FAF7F2',
        surface: '#F0EBE1',
        'text-main': '#2C2825',
        'text-muted': '#7A7067',
        accent: '#8BA888',
        border: '#DDD5C8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Lora', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
