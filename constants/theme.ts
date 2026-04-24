import { Platform } from "react-native";

import rawColorTokens from "./theme.colors.json";

type BasePalette = typeof rawColorTokens.light;

function createThemePalette(palette: BasePalette) {
  return {
    ...palette,
    // Backward-compatible aliases while screens migrate to semantic names.
    text: palette.foreground,
    tint: palette.accent,
    icon: palette.mutedLight,
    tabIconDefault: palette.mutedLight,
    tabIconSelected: palette.accent,
    card: palette.surface,
  };
}

/**
 * App color source of truth lives in `theme.colors.json`.
 * `Colors` adds runtime aliases for legacy Expo starter components.
 */
export const Colors = {
  light: createThemePalette(rawColorTokens.light),
  dark: createThemePalette(rawColorTokens.dark),
} as const;

export type ThemeColors = (typeof Colors)[keyof typeof Colors];
export type ThemeColorName = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
