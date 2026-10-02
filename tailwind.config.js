/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Player names are styled `font-anton` (PlayerNameMini, the profile
      // header, list exports), and src/styles/antonFont.css loads the face --
      // but until this was registered the class generated no CSS at all, so
      // every name fell back to the plain system font.
      fontFamily: {
        anton: ['AntonLocal', 'Impact', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};
