import { View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

type CardTone = 'accentSoft' | 'surface' | 'surfaceAlt';

export type CardProps = ViewProps & {
  tone?: CardTone;
};

export function Card({ style, tone = 'surface', ...props }: CardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const backgroundColor =
    tone === 'surfaceAlt' ? colors.surfaceAlt : tone === 'accentSoft' ? colors.accentSoft : colors.surface;

  return (
    <View
      style={[
        {
          backgroundColor,
          borderColor: colors.border,
          borderRadius: 24,
          borderWidth: 1,
        },
        style,
      ]}
      {...props}
    />
  );
}
