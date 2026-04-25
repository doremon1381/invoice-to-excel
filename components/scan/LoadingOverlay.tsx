import { ActivityIndicator, View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

interface LoadingOverlayProps {
  message: string;
  /** When set, uses the dark palette regardless of system appearance (e.g. scan screen). */
  variant?: 'dark' | 'default';
}

export function LoadingOverlay({ message, variant = 'default' }: LoadingOverlayProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = variant === 'dark' ? Colors.dark : Colors[colorScheme];

  return (
    <View
      className="absolute inset-0 z-20 items-center justify-center px-6"
      style={{ backgroundColor: colors.scrimSoft }}>
      <View
        className="w-full max-w-[280px] items-center rounded-3xl border px-6 py-5"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
        <ActivityIndicator size="large" color={colors.accent} />
        {variant === 'dark' ? (
          <ThemedText className="mt-3 text-center" style={{ color: colors.foreground }}>
            {message}
          </ThemedText>
        ) : (
          <ThemedText className="mt-3 text-center">{message}</ThemedText>
        )}
      </View>
    </View>
  );
}
