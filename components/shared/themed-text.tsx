import { StyleSheet, Text, type TextProps } from 'react-native';

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
    | 'overline';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'foreground');
  const linkColor = useThemeColor({}, 'accent');

  return (
    <Text
      style={[
        { color },
        type === 'default' || type === 'body' ? styles.body : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'title' || type === 'display' ? styles.display : undefined,
        type === 'subtitle' || type === 'heading' ? styles.heading : undefined,
        type === 'caption' ? styles.caption : undefined,
        type === 'overline' ? styles.overline : undefined,
        type === 'link' ? [styles.link, { color: linkColor }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  display: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  overline: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
});
