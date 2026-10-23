/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'washi': '#E6DFCF',
        'washi-dark': '#D8CEB8',
        'sumi': '#1C1A17',
        'sumi-muted': '#524D46',
        'crimson': '#6E2B25',
        'crimson-light': '#8C3B33',
      },
      fontFamily: {
        'jp': ['"Shippori Mincho"', '"Noto Serif JP"', 'serif'],
        'heading': ['"Cormorant Garamond"', 'Georgia', 'serif'],
        'body': ['"EB Garamond"', 'Georgia', 'serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
