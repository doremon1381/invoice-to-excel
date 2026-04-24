/** @type {import('tailwindcss').Config} */
const typographyTokens = require('./constants/typography.tokens.json');
const themeColors = require('./constants/theme.colors.json');

/** @param {{ size: number; lineHeight: number }} t */
function fontSizeTuple(t) {
  return [`${t.size}px`, { lineHeight: `${t.lineHeight}px` }];
}

/** @param {Record<string, string>} palette */
function mapTheme(palette) {
  return Object.fromEntries(Object.entries(palette).map(([key, value]) => [key, value]));
}

/** @param {Record<string, string>} palette */
function mapThemeWithSuffix(palette, suffix) {
  return Object.fromEntries(
    Object.entries(palette).map(([key, value]) => [`${key}-${suffix}`, value])
  );
}

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontSize: {
        '2xs': fontSizeTuple(typographyTokens['2xs']),
        tiny: fontSizeTuple(typographyTokens.tiny),
        xs: fontSizeTuple(typographyTokens.xs),
        caption: fontSizeTuple(typographyTokens.caption),
        sm: fontSizeTuple(typographyTokens.sm),
        md: fontSizeTuple(typographyTokens.md),
        base: fontSizeTuple(typographyTokens.base),
        lead: fontSizeTuple(typographyTokens.lead),
        xl: fontSizeTuple(typographyTokens.xl),
        display: fontSizeTuple(typographyTokens.display),
        'display-lg': fontSizeTuple(typographyTokens.displayLg),
      },
      colors: {
        ...mapTheme(themeColors.light),
        ...mapThemeWithSuffix(themeColors.dark, 'dark'),
        light: mapTheme(themeColors.light),
        dark: mapTheme(themeColors.dark),
      },
    },
  },
  plugins: [],
};
