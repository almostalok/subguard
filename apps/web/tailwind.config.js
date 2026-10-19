/** @type {import('tailwindcss').Config} */
const basePreset = require('../../packages/config/tailwind.preset.js');

module.exports = {
  presets: [basePreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
};
