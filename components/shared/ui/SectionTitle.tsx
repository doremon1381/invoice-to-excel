import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

type SectionTitleProps = ViewProps & {
  title: string;
  description?: string;
  rightSlot?: ReactNode;
};

export function SectionTitle({
  title,
  description,
  rightSlot,
  style,
  ...props
}: SectionTitleProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={style} {...props}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <ThemedText type="heading" numberOfLines={1} scaleRole="chrome">
            {title}
          </ThemedText>
          {description ? (
            <ThemedText style={{ color: colors.muted }}>{description}</ThemedText>
          ) : null}
        </View>
        {rightSlot}
      </View>
    </View>
  );
}
