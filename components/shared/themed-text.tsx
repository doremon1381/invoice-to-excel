import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/theme/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
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

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'foreground');
  const linkColor = useThemeColor({}, 'accent');

  const typographyClass = typeClassName(type);
  const mergedClassName = [typographyClass, className].filter(Boolean).join(' ');

  return (
    <Text
      className={mergedClassName}
      style={[
        { color },
        type === 'link' ? { color: linkColor } : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
