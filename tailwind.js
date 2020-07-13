const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  purge: [],
  theme: {
    extend: {

      fontFamily: {
        sans: ["Ubuntu", ...defaultTheme.fontFamily.sans]
      }

    },
  },
  variants: {},
  plugins: [],
}
