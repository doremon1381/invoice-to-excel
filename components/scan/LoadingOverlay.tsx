import { ActivityIndicator, View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View className="absolute inset-0 z-20 items-center justify-center bg-black/35 px-6">
      <View
        className="w-full max-w-[280px] items-center rounded-3xl border px-6 py-5"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText className="mt-3 text-center">{message}</ThemedText>
      </View>
    </View>
  );
}
