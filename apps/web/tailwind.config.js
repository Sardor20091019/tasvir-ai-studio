module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Theme-driven tokens via CSS custom properties
        obsidian: 'var(--bg-base)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          raised: 'var(--bg-surface-raised)',
          overlay: 'var(--bg-surface-overlay)',
        },
        slate: {
          muted: 'var(--border-stroke-hover)',
          subtle: 'var(--border-stroke)',
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          light: 'var(--text-dim)',
          dim: 'var(--text-dim)',
        },
        accent: {
          DEFAULT: 'var(--accent-warm)',
          warm: 'var(--accent-warm)',
          cold: 'var(--accent-cold)',
        },
        stroke: {
          DEFAULT: 'var(--border-stroke)',
          hover: 'var(--border-stroke-hover)',
          active: 'var(--border-stroke-active)',
        },
        signal: {
          red: 'var(--signal-red)',
          green: 'var(--signal-green)',
          amber: 'var(--signal-amber)',
        },
        // Legacy compatibility tokens
        canvas: 'var(--bg-base)',
        border: 'var(--border-stroke)',
        coral: {
          DEFAULT: 'var(--accent-warm)',
          hover: 'var(--accent-warm-hover)',
          light: 'var(--accent-warm-subtle)',
        },
        cobalt: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#DBEAFE',
        },
        bento: {
          peach: 'var(--bg-surface-raised)',
          mint: 'var(--bg-surface-raised)',
          sky: 'var(--bg-surface-raised)',
          lavender: 'var(--bg-surface-raised)',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        studio: '2px',
      },
      boxShadow: {
        tactile: 'var(--shadow-tactile)',
        'tactile-md': 'var(--shadow-tactile-md)',
        'tactile-lg': 'var(--shadow-tactile-lg)',
        cinema: 'var(--shadow-cinema)',
        'inset-subtle': 'inset 0 1px 0 rgba(255,255,255,0.03), inset 0 -1px 0 rgba(0,0,0,0.15)',
      },
      fontSize: {
        'display-xl': ['clamp(3.5rem, 7vw, 7rem)', { lineHeight: '0.92', letterSpacing: '-0.04em' }],
        'display': ['clamp(2.5rem, 5vw, 5rem)', { lineHeight: '0.95', letterSpacing: '-0.035em' }],
        'editorial': ['clamp(1.5rem, 3vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      animation: {
        'scan-line': 'scanLine 8s linear infinite',
        'grain': 'grain 0.5s steps(1) infinite',
        'fade-up': 'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fadeIn 0.6s ease forwards',
        'cursor-blink': 'cursorBlink 1s step-end infinite',
        'slow-drift': 'slowDrift 20s ease-in-out infinite',
      },
      keyframes: {
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        grain: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-5%, -10%)' },
          '20%': { transform: 'translate(-15%, 5%)' },
          '30%': { transform: 'translate(7%, -25%)' },
          '40%': { transform: 'translate(-5%, 25%)' },
          '50%': { transform: 'translate(-15%, 10%)' },
          '60%': { transform: 'translate(15%, 0%)' },
          '70%': { transform: 'translate(0%, 15%)' },
          '80%': { transform: 'translate(3%, 35%)' },
          '90%': { transform: 'translate(-10%, 10%)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        cursorBlink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        slowDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(2%, 1%) scale(1.01)' },
          '50%': { transform: 'translate(-1%, 2%) scale(1.02)' },
          '75%': { transform: 'translate(1%, -1%) scale(1.01)' },
        },
      },
    },
  },
  plugins: [],
};
