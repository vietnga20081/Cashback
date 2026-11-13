import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        // GreenCash Brand
        primary: {
          DEFAULT: '#16A34A',
          hover: '#15803D',
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        secondary: { DEFAULT: '#22C55E' },

        background: '#F7FAF8',
        card: { DEFAULT: '#FFFFFF', foreground: '#1F2937' },
        foreground: '#1F2937',

        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',

        // Shadcn compat
        border: '#E5E7EB',
        input: '#E5E7EB',
        ring: '#16A34A',
        muted: {
          DEFAULT: '#F3F4F6',
          foreground: '#6B7280',
        },
        accent: {
          DEFAULT: '#F0FDF4',
          foreground: '#15803D',
        },
        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#FEF2F2',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#1F2937',
        },
      },

      borderRadius: {
        DEFAULT: '20px',
        lg: '20px',
        md: '16px',
        sm: '12px',
        xs: '8px',
      },

      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(22,163,74,0.1), 0 1px 3px rgba(0,0,0,0.06)',
        soft: '0 2px 8px rgba(0,0,0,0.06)',
        green: '0 4px 20px rgba(22,163,74,0.2)',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(22,163,74,0.3)' },
          '50%': { boxShadow: '0 0 0 8px rgba(22,163,74,0)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },

      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
