import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/shared/themed-text";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";

type ScanCallToActionProps = {
  onPress: () => void;
};

export function ScanCallToAction({ onPress }: ScanCallToActionProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Pressable
      accessibilityRole="button"
      className="mt-3 min-h-[142px] flex-col rounded-[24px] px-4 py-4"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.accent,
        justifyContent: "space-between",
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View
        className="h-11 w-11 items-center justify-center self-end rounded-xl"
        style={{ backgroundColor: colors.surface }}
      >
        <IconSymbol name="camera.fill" size={24} color={colors.accent} />
      </View>
      <View>
        <ThemedText
          type="custom"
          className="text-display font-bold"
          style={{
            color: colors.onAccent,
            fontSize: Typography.display.size,
            lineHeight: Typography.display.lineHeight,
          }}
        >
          {t("home.scanLine1")}
        </ThemedText>
        <ThemedText
          type="custom"
          className="text-display font-bold"
          style={{
            color: colors.onAccent,
            fontSize: Typography.display.size,
            lineHeight: Typography.display.lineHeight,
          }}
        >
          {t("home.scanLine2")}
        </ThemedText>
      </View>
    </Pressable>
  );
}
