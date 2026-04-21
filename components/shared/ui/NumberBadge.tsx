import { Text, View } from 'react-native';

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
      <Text style={{ color: colors.background, fontSize: 14, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}
