import { Pressable, StyleSheet, type GestureResponderEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface ScanButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
}

export function ScanButton({ label, onPress, disabled = false }: ScanButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? colors.border : colors.tint,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <ThemedText style={styles.label} lightColor="#FFFFFF" darkColor="#FFFFFF">
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  label: {
    fontWeight: '700',
  },
});
