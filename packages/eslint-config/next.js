/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./index.js', 'next/core-web-vitals'],
  rules: {
    'no-console': 'off',
  },
}
