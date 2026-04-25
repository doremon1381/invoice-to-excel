import type { ReactNode } from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText, getTextMaxFontSizeMultiplier } from '@/components/shared/themed-text';
import { Typography } from '@/constants/typography';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

type FieldInputProps = TextInputProps & {
  accentBorder?: boolean;
  label: string;
  trailing?: ReactNode;
};

export function FieldInput({
  accentBorder = false,
  label,
  trailing,
  style,
  ...textInputProps
}: FieldInputProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View className="gap-1.5">
      <ThemedText
        className="text-caption font-medium"
        scaleRole="chrome"
        style={{ color: colors.muted }}
        type="custom"
      >
        {label}
      </ThemedText>
      <View
        className="min-h-[52px] flex-row items-center rounded-[18px] border px-3"
        style={{
          backgroundColor: colors.surface,
          borderColor: accentBorder ? colors.accent : colors.border,
        }}>
        <TextInput
          allowFontScaling
          maxFontSizeMultiplier={getTextMaxFontSizeMultiplier('body')}
          placeholderTextColor={colors.muted}
          style={[
            {
              color: colors.foreground,
              flex: 1,
              fontSize: Typography.base.size,
              includeFontPadding: Platform.OS === 'android' ? false : undefined,
              lineHeight: Typography.base.lineHeight,
              paddingVertical: 12,
            },
            style,
          ]}
          {...textInputProps}
        />
        {trailing ? <View className="pl-1">{trailing}</View> : null}
      </View>
    </View>
  );
}
