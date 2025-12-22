/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0077B6',
        'accent-primary': '#F77F00',
        wall: '#FAFAF8',
        'accent-wall': '#E7F4F7',
        text: '#333333'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif']
      },
      fontSize: {
        'h1': ['48px', { lineHeight: '1' }],
        'h2': ['36px', { lineHeight: '1.1' }],
        'h3': ['28px', { lineHeight: '1.1' }],
        'upheading': ['22px', { lineHeight: '1', letterSpacing: '0.08em' }],
        'subheading': ['18px', { lineHeight: '1.3' }],
        'body-md': ['16px', { lineHeight: '1.5' }],
        'small': ['14px', { lineHeight: '1.4' }],
        'cta': ['16px', { lineHeight: '1' }]
      }
    }
  },
  plugins: []
}
