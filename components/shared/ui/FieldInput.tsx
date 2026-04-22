import type { ReactNode } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

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
      <Text className="text-caption font-medium" style={{ color: colors.muted }}>
        {label}
      </Text>
      <View
        className="min-h-[52px] flex-row items-center rounded-[18px] border px-3"
        style={{
          backgroundColor: colors.surface,
          borderColor: accentBorder ? colors.accent : colors.border,
        }}>
        <TextInput
          placeholderTextColor={colors.muted}
          style={[
            {
              color: colors.foreground,
              flex: 1,
              fontSize: Typography.base.size,
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
