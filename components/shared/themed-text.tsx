import { Platform, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/theme/use-theme-color';

export type TextScaleRole = 'body' | 'heading' | 'chrome';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  scaleRole?: TextScaleRole;
  type?:
    | 'default'
    | 'title'
    | 'defaultSemiBold'
    | 'subtitle'
    | 'link'
    | 'display'
    | 'heading'
    | 'body'
    | 'caption'
    | 'overline'
    /** No preset `text-*` size; use `className` for typography (e.g. stats with `text-display`). */
    | 'custom';
};

export function getTextMaxFontSizeMultiplier(scaleRole: TextScaleRole): number {
  switch (scaleRole) {
    case 'chrome':
      return 1;
    case 'heading':
      return 1.1;
    case 'body':
    default:
      return 1.3;
  }
}

function typeClassName(type: ThemedTextProps['type']): string {
  switch (type) {
    case 'custom':
      return '';
    case 'default':
    case 'body':
      return 'text-base';
    case 'defaultSemiBold':
      return 'text-base font-semibold';
    case 'title':
    case 'display':
      return 'text-display-lg font-bold';
    case 'subtitle':
    case 'heading':
      return 'text-xl font-bold';
    case 'caption':
      return 'text-caption';
    case 'overline':
      return 'text-xs font-bold tracking-wider uppercase';
    case 'link':
      return 'text-base';
    default:
      return 'text-base';
  }
}

function defaultScaleRole(type: ThemedTextProps['type']): TextScaleRole {
  switch (type) {
    case 'title':
    case 'display':
    case 'subtitle':
    case 'heading':
      return 'heading';
    case 'overline':
      return 'chrome';
    case 'default':
    case 'defaultSemiBold':
    case 'body':
    case 'caption':
    case 'link':
    case 'custom':
    default:
      return 'body';
  }
}

export function ThemedText({
  allowFontScaling = true,
  style,
  lightColor,
  darkColor,
  maxFontSizeMultiplier,
  scaleRole,
  type = 'default',
  className,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'foreground');
  const linkColor = useThemeColor({}, 'accent');
  const resolvedScaleRole = scaleRole ?? defaultScaleRole(type);

  const typographyClass = typeClassName(type);
  const mergedClassName = [typographyClass, className].filter(Boolean).join(' ');

  return (
    <Text
      allowFontScaling={allowFontScaling}
      className={mergedClassName}
      maxFontSizeMultiplier={
        maxFontSizeMultiplier ?? getTextMaxFontSizeMultiplier(resolvedScaleRole)
      }
      style={[
        Platform.OS === 'android' ? { includeFontPadding: false } : undefined,
        { color },
        type === 'link' ? { color: linkColor } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
