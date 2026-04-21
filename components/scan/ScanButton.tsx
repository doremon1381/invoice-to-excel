import { Pressable, type GestureResponderEvent } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

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
      className="min-h-[52px] items-center justify-center rounded-2xl px-4 py-4"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: disabled ? colors.border : colors.accent,
        opacity: pressed ? 0.85 : 1,
      })}>
      <ThemedText style={{ color: colors.onAccent, fontWeight: '700' }}>{label}</ThemedText>
    </Pressable>
  );
}
