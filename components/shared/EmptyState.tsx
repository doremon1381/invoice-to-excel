import { View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      className="mt-6 rounded-3xl border px-6 py-8"
      style={{ backgroundColor: colors.card, borderColor: colors.border }}>
      <ThemedText type="subtitle" style={{ marginBottom: 8, textAlign: 'center' }}>
        {title}
      </ThemedText>
      <ThemedText style={{ color: colors.muted, textAlign: 'center' }}>{description}</ThemedText>
    </View>
  );
}
