import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';
type ButtonSize = 'sm' | 'md';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  ...props
}: ButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const isDisabled = disabled || loading;

  const labelColor =
    variant === 'secondary'
      ? colors.foreground
      : variant === 'destructive'
        ? colors.onDanger
        : colors.onAccent;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => {
        const baseStyle: ViewStyle = {
          alignItems: 'center',
          borderRadius: size === 'sm' ? 999 : 16,
          flexDirection: 'row',
          justifyContent: 'center',
          minHeight: size === 'sm' ? 40 : 52,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          paddingHorizontal: size === 'sm' ? 16 : 18,
          paddingVertical: size === 'sm' ? 8 : 12,
        };

        if (variant === 'secondary') {
          return [
            baseStyle,
            { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
            style,
          ];
        }

        if (variant === 'destructive') {
          return [baseStyle, { backgroundColor: colors.danger }, style];
        }

        return [baseStyle, { backgroundColor: colors.accent }, style];
      }}
      {...props}
    >
      <ThemedText
        className={size === 'sm' ? 'text-sm font-bold' : 'text-base font-bold'}
        numberOfLines={1}
        scaleRole="chrome"
        style={{ color: labelColor, flexShrink: 1, textAlign: 'center' }}
        type="custom"
      >
        {loading ? `${label}...` : label}
      </ThemedText>
    </Pressable>
  );
}
