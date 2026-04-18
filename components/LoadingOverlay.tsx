import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <ThemedText style={styles.message}>{message}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    padding: 24,
    zIndex: 20,
  },
  card: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    maxWidth: 280,
    paddingHorizontal: 24,
    paddingVertical: 20,
    width: '100%',
  },
  message: {
    textAlign: 'center',
  },
});
