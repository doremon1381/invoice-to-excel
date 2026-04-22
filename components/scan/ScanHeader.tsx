import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import type { Colors } from "@/constants/theme";

type ScanHeaderProps = {
  colors: (typeof Colors)["light"] | (typeof Colors)["dark"];
  title: string;
  onClose: () => void;
  onOpenSettings: () => void;
};

export function ScanHeader({
  colors,
  onClose,
  onOpenSettings,
  title,
}: ScanHeaderProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-row items-center justify-between px-1">
      {/* TODO: Add close button later */}
      {/* <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('scan.a11yCloseScan')}
        className="h-10 w-10 items-center justify-center rounded-full"
        onPress={onClose}
        style={({ pressed }) => ({ backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 })}>
        <IconSymbol name="xmark" size={18} color={colors.foreground} />
      </Pressable> */}

      <Text
        numberOfLines={1}
        className="flex-1 text-center text-md font-bold uppercase tracking-wider"
        style={{
          color: colors.accent,
          marginHorizontal: 8,
        }}
      >
        {title}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("scan.a11yOpenSettings")}
        className="h-10 w-10 items-center justify-center rounded-full"
        onPress={onOpenSettings}
        style={({ pressed }) => ({
          backgroundColor: colors.surface,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <IconSymbol name="gearshape.fill" size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}
