/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gaming: {
          bg:     "#f0f2f8",   /* overridden by CSS vars */
          card:   "#ffffff",
          border: "#dde1ef",
          accent: "#4f46e5",
          neon:   "#4f46e5",
          cyan:   "#0284c7",
          green:  "#059669",
          red:    "#dc2626",
          text:   "#0f172a",
          muted:  "#5a6481",
        }
      },
      boxShadow: {
        'neon-purple': '0 4px 30px rgba(99,102,241,0.2)',
        'neon-cyan':   '0 4px 30px rgba(2,132,199,0.2)',
        'neon-green':  '0 4px 30px rgba(5,150,105,0.2)',
        'glow-accent': '0 0 40px rgba(99,102,241,0.25), 0 4px 16px rgba(99,102,241,0.15)',
        'glow-sm':     '0 0 20px rgba(99,102,241,0.15)',
        'card':        '0 2px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)',
      },
      /* bg-grid-pattern now handled via CSS vars in index.css */
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18), transparent)',
        'hero-radial':   'radial-gradient(ellipse at center, rgba(8,11,20,0) 0%, rgba(8,11,20,0.6) 100%)',
        'card-shine':    'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)',
      },
      fontFamily: {
        sans:    ['"Inter"', '"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Inter"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':      'float 4s ease-in-out infinite',
        'spin-slow':  'spin-slow 12s linear infinite',
        'shimmer':    'shimmer 1.6s infinite',
        'fade-up':    'fadeUp 0.5s ease both',
        'scale-up':   'scaleUp 0.25s ease both',
        'orb1':       'orb1 12s ease-in-out infinite',
        'orb2':       'orb2 16s ease-in-out infinite',
        'grad-shift': 'gradShift 4s ease infinite',
      },
      keyframes: {
        float:     { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-10px)' } },
        'spin-slow': { from:{ transform:'rotate(0deg)' }, to:{ transform:'rotate(360deg)' } },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [],
}
