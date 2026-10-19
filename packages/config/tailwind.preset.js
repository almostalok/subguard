/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#FAF9F6',
        surface: '#FFFFFF',
        'surface-subtle': '#F5F5F3',
        'surface-hover': '#EFEFEA',
        border: '#E2E2DC',
        'border-strong': '#C8C8C0',
        primary: {
          DEFAULT: '#0F172A',
          hover: '#1E293B',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#64748B',
          foreground: '#94A3B8',
        },
        status: {
          verified: '#059669',
          'verified-bg': '#ECFDF5',
          'verified-border': '#A7F3D0',
          warning: '#D97706',
          'warning-bg': '#FFFBEB',
          'warning-border': '#FDE68A',
          risk: '#DC2626',
          'risk-bg': '#FEF2F2',
          'risk-border': '#FECACA',
          info: '#2563EB',
          'info-bg': '#EFF6FF',
          'info-border': '#BFDBFE',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
