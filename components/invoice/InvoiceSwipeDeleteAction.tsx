import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/shared/themed-text";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";

export const INVOICE_SWIPE_ACTION_WIDTH = 96;

type InvoiceSwipeDeleteActionProps = {
  progress: SharedValue<number>;
  onPress: () => void;
};

export function InvoiceSwipeDeleteAction({
  progress,
  onPress,
}: InvoiceSwipeDeleteActionProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const contentStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [INVOICE_SWIPE_ACTION_WIDTH * 0.4, 0],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 0.6, 1],
      Extrapolation.CLAMP,
    );
    return { opacity, transform: [{ translateX }] };
  });

  return (
    <View
      style={{
        backgroundColor: colors.danger,
        width: INVOICE_SWIPE_ACTION_WIDTH,
      }}
    >
      <Pressable
        accessibilityLabel={t("invoice.deleteInvoice")}
        accessibilityRole="button"
        className="h-full w-full items-center justify-center px-2"
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
      >
        <Animated.View
          className="items-center justify-center gap-1"
          style={contentStyle}
        >
          <IconSymbol name="trash.fill" size={22} color={colors.onDanger} />
          <ThemedText
            type="custom"
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: colors.onDanger }}
          >
            {t("common.delete")}
          </ThemedText>
        </Animated.View>
      </Pressable>
    </View>
  );
}
