import { Pressable, Text, View } from 'react-native';

import { IconSymbol } from '@/components/shared/ui/icon-symbol';
import type { Colors } from '@/constants/theme';

type ScanHeaderProps = {
  colors: (typeof Colors)['dark'];
  title: string;
  onClose: () => void;
  onOpenSettings: () => void;
};

export function ScanHeader({ colors, onClose, onOpenSettings, title }: ScanHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close scan"
        className="h-10 w-10 items-center justify-center rounded-full"
        onPress={onClose}
        style={({ pressed }) => ({ backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 })}>
        <IconSymbol name="xmark" size={18} color={colors.foreground} />
      </Pressable>

      <Text
        numberOfLines={1}
        style={{
          color: colors.accent,
          flex: 1,
          fontSize: 15,
          fontWeight: '700',
          letterSpacing: 0.8,
          marginHorizontal: 8,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}>
        {title}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        className="h-10 w-10 items-center justify-center rounded-full"
        onPress={onOpenSettings}
        style={({ pressed }) => ({ backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 })}>
        <IconSymbol name="gearshape.fill" size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
