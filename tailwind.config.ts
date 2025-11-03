import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Artisanal color palette: Rajasthan craft meets Scandinavian minimalism
        // Backgrounds
        ivory: '#F7F4EE',        // Cotton ivory - soft, paper-like
        warmIvory: '#F2EDE4',    // Warmer variation
        cream: '#FAF8F3',        // Lightest tone
        
        // Primary colors
        indigo: '#2F3A4A',       // Deep indigo - artisanal, not corporate
        deepIndigo: '#2F3A4A',   // Alias for consistency
        indigoDeep: '#253141',   // Darker shade
        
        // Secondary & accents
        ochre: '#C9974C',        // Burnished ochre - natural dyes
        warmOchre: '#C9974C',    // Alias
        clay: '#C97E63',         // Clay rose - Rajasthan textiles
        mutedRose: '#C97E63',    // Alias
        clayDark: '#B36B54',     // Darker clay for contrast
        
        // Supporting tones
        terracotta: '#D4917A',   // Softer terracotta
        sage: '#8B9A7E',         // Muted sage green
        antiqueBronze: '#A67C52', // Bronze tone
        
        // Neutrals
        graphite: '#4A4440',     // Warm graphite
        softCharcoal: '#5A5550', // Softer charcoal
        warmBlack: '#1E1C1A',    // Off-black with warmth
        
        // Legacy compatibility
        antiqueGold: '#C9974C',
        ochreRed: '#C97E63'
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


