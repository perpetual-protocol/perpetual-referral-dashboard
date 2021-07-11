module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'perp-body': '#040404',
        'perp-cyan': '#65E6FF',
        'perp-cyan-secondary': '#86e6f7',
        'perp-light-green': '#7FE7AF',
        'perp-red': '#F4ABAB',
        'perp-gray-50': '#7B828D',
        'perp-gray-100': '#53636A',
        'perp-gray-200': '#414347',
        'perp-gray-300': '#232425',
        'perp-input-bg': 'rgba(255, 255, 255, 0.06)'
      },
      fontFamily: {
        'body': ['SF Pro Text']
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
