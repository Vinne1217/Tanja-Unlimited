import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Sophisticated color palette inspired by Rajasthan textiles
        ivory: '#F7F4EE',
        warmIvory: '#F2EDE4',
        deepIndigo: '#2B3A67',
        indigoDeep: '#1E2847',
        warmOchre: '#D4A574',
        mutedRose: '#D4A5A5',
        antiqueGold: '#C9A961',
        terracotta: '#B85F4E',
        sage: '#8B9A7E',
        warmBlack: '#2A2A2A',
        softCharcoal: '#4A4A4A',
        cream: '#FAF8F3',
        // Legacy colors for compatibility
        ochreRed: '#A13E2A'
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
      },
      letterSpacing: {
        'wide': '0.025em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
      backdropBlur: {
        xs: '2px',
      }
    }
  },
  plugins: []
} satisfies Config;


