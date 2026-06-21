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
        // Legacy mappings (keep existing components working)
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        accent: 'var(--accent)',
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        moderate: 'var(--moderate)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        // CalmRoot brand palette
        'cr-primary': '#4A7C59',
        'cr-primary-light': '#6BAE7F',
        'cr-primary-dark': '#2D5A3D',
        'cr-secondary': '#8B7355',
        'cr-accent': '#C4A882',
        'cr-bg': '#F7F5F0',
        'cr-surface': '#FFFFFF',
        'cr-surface-alt': '#EEF2EC',
        'cr-text': '#2C3E2D',
        'cr-text-muted': '#6B7C6B',
        'cr-border': '#D4DDD4',
        'cr-error': '#C0705A',
        'cr-gold': '#D4AF37',
        'cr-purple': '#7C5C9E',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 8s ease-in-out infinite 2s',
        'pulse-soft': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'rotate-slow': 'rotateSlow 20s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'scroll-left': 'scrollLeft 30s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', filter: 'blur(4px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        rotateSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(74, 124, 89, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(74, 124, 89, 0.7)' },
        },
        morph: {
          '0%, 100%': { borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%' },
          '50%': { borderRadius: '30% 60% 70% 40%/50% 60% 30% 60%' },
        },
        scrollLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': `
          radial-gradient(at 40% 20%, #4A7C59 0px, transparent 50%),
          radial-gradient(at 80% 0%, #2D5A3D 0px, transparent 50%),
          radial-gradient(at 0% 50%, #6BAE7F 0px, transparent 50%)
        `,
      },
    },
  },
  plugins: [],
}
