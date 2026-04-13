/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './js/**/*.js',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          bg:        'var(--bg-color)',
          text:      'var(--text-color)',
          secondary: '#86868b',
          blue:      '#0a84ff',
          green:     '#30d158',
          red:       '#ff453a',
          orange:    '#ff9f0a',
          purple:    '#bf5af2',
        }
      },
      fontFamily: {
        sans:    ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
        mono:    ['SF Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
      }
    }
  },
  plugins: [],
}
