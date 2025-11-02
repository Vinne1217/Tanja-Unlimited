import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        indigoDeep: '#1E2333',
        warmBlack: '#111111',
        cream: '#F6F1E8',
        ochreRed: '#A13E2A'
      }
    }
  },
  plugins: []
} satisfies Config;


