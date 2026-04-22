import { Image, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconSymbol } from '@/components/shared/ui/icon-symbol';
import type { Colors } from '@/constants/theme';

type ScanControlsProps = {
  colors: (typeof Colors)['light'] | (typeof Colors)['dark'];
  onCapture: () => void;
  onImport: () => void;
  onRescan: () => void;
  previewUri: string | null;
};

export function ScanControls({ colors, onCapture, onImport, onRescan, previewUri }: ScanControlsProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-end justify-between gap-5 pb-2">
      <Pressable
        accessibilityLabel={t('scan.a11yImportGallery')}
        accessibilityRole="button"
        className="h-14 w-14 items-center justify-center rounded-2xl border"
        onPress={onImport}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        })}>
        {previewUri ? (
          <Image source={{ uri: previewUri }} className="h-10 w-10 rounded-xl" resizeMode="cover" />
        ) : (
          <IconSymbol name="square.and.arrow.up.fill" size={22} color={colors.foreground} />
        )}
      </Pressable>

      <Pressable
        accessibilityLabel={t('scan.a11yCapture')}
        accessibilityRole="button"
        className="h-24 w-24 items-center justify-center rounded-full border-[6px]"
        onPress={onCapture}
        style={({ pressed }) => ({
          backgroundColor: colors.accent,
          borderColor: colors.accentBorder,
          opacity: pressed ? 0.9 : 1,
          shadowColor: colors.accent,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.45,
          shadowRadius: 12,
          elevation: 8,
        })}>
        <View className="h-16 w-16 rounded-full border-2" style={{ borderColor: colors.onAccent }} />
      </Pressable>

      <Pressable
        accessibilityLabel={t('scan.a11yRescan')}
        accessibilityRole="button"
        className="h-14 w-14 items-center justify-center rounded-full border"
        onPress={onRescan}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        })}>
        <IconSymbol name="arrow.clockwise" size={22} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
