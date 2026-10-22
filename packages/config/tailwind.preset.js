/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#0A0A0A',
        'surface-subtle': '#111111',
        'surface-hover': '#171717',
        border: '#222222',
        'border-strong': '#2E2E2E',
        primary: {
          DEFAULT: '#FFFFFF',
          hover: '#E5E5E5',
          foreground: '#000000',
        },
        muted: {
          DEFAULT: '#888888',
          foreground: '#A1A1A1',
        },
        status: {
          verified: '#00E599',
          'verified-bg': 'rgba(0, 229, 153, 0.08)',
          'verified-border': 'rgba(0, 229, 153, 0.25)',
          warning: '#F5A623',
          'warning-bg': 'rgba(245, 166, 35, 0.08)',
          'warning-border': 'rgba(245, 166, 35, 0.25)',
          risk: '#EE0000',
          'risk-bg': 'rgba(238, 0, 0, 0.08)',
          'risk-border': 'rgba(238, 0, 0, 0.25)',
          info: '#0070F3',
          'info-bg': 'rgba(0, 112, 243, 0.08)',
          'info-border': 'rgba(0, 112, 243, 0.25)',
        },
      },
      fontFamily: {
        sans: [
          'Geist',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'Geist Mono',
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        'vercel-card': '0 0 0 1px #222222',
        'vercel-card-hover': '0 0 0 1px #333333, 0 8px 24px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
