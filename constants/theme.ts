/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const lightPalette = {
  background: '#F8FAFC',
  foreground: '#1F2937',
  surface: '#FFFFFF',
  surfaceAlt: '#FFF5F9',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',
  border: '#F3E8EE',
  borderFocus: '#F9A8D4',
  divider: '#E5E7EB',
  accent: '#F472B6',
  accentSoft: 'rgba(236, 72, 153, 0.10)',
  accentSoft2: 'rgba(236, 72, 153, 0.06)',
  accentBorder: '#F9A8D4',
  titleGradientFrom: '#EC4899',
  titleGradientTo: '#F472B6',
  scanFrom: '#F472B6',
  scanTo: '#F9A8D4',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  info: '#EC4899',
  infoSoft: 'rgba(236, 72, 153, 0.10)',
  onAccent: '#FFFFFF',
  onDanger: '#FFFFFF',
} as const;

const darkPalette = {
  background: '#020617',
  foreground: '#F8FAFC',
  surface: '#0F172A',
  surfaceAlt: '#1E293B',
  muted: '#CBD5E1',
  mutedLight: '#94A3B8',
  border: '#334155',
  borderFocus: '#93C5FD',
  divider: '#1F2937',
  accent: '#60A5FA',
  accentSoft: 'rgba(96, 165, 250, 0.12)',
  accentSoft2: 'rgba(96, 165, 250, 0.08)',
  accentBorder: '#93C5FD',
  titleGradientFrom: '#60A5FA',
  titleGradientTo: '#3B82F6',
  scanFrom: '#60A5FA',
  scanTo: '#93C5FD',
  success: '#4ADE80',
  successSoft: '#14532D',
  warning: '#F59E0B',
  warningSoft: '#78350F',
  danger: '#F87171',
  dangerSoft: '#7F1D1D',
  info: '#60A5FA',
  infoSoft: 'rgba(96, 165, 250, 0.12)',
  onAccent: '#FFFFFF',
  onDanger: '#FFFFFF',
} as const;

export const Colors = {
  light: {
    ...lightPalette,
    // Backward-compatible aliases while screens migrate to semantic names.
    text: lightPalette.foreground,
    tint: lightPalette.accent,
    icon: lightPalette.mutedLight,
    tabIconDefault: lightPalette.mutedLight,
    tabIconSelected: lightPalette.accent,
    card: lightPalette.surface,
  },
  dark: {
    ...darkPalette,
    // Backward-compatible aliases while screens migrate to semantic names.
    text: darkPalette.foreground,
    tint: darkPalette.accent,
    icon: darkPalette.mutedLight,
    tabIconDefault: darkPalette.mutedLight,
    tabIconSelected: darkPalette.accent,
    card: darkPalette.surface,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
