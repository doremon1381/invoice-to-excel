import { ActivityIndicator, View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View className="flex-1 items-center justify-center gap-3 px-5">
      <ActivityIndicator size="small" color={colors.accent} />
      <ThemedText style={{ color: colors.muted }}>{message}</ThemedText>
    </View>
  );
}
