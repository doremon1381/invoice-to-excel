import { View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

type NumberBadgeProps = {
  value: number | string;
};

export function NumberBadge({ value }: NumberBadgeProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      className="h-9 w-9 items-center justify-center rounded-full"
      style={{ backgroundColor: colors.foreground }}>
      <ThemedText
        className="text-sm font-extrabold"
        scaleRole="chrome"
        style={{ color: colors.background }}
        type="custom"
      >
        {value}
      </ThemedText>
    </View>
  );
}
