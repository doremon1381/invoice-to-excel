import type { ReactNode } from "react";
import { useWindowDimensions, View, type ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/shared/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";

type PageTitleProps = ViewProps & {
  title: string;
  titleClassName?: string;
  right?: ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
  fallbackColor?: string;
  showDivider?: boolean;
};

export function PageTitle({
  title,
  titleClassName,
  right,
  gradientFrom,
  gradientTo,
  fallbackColor,
  showDivider = true,
  className,
  ...props
}: PageTitleProps) {
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const isCompact = width <= 430;
  const fallback = fallbackColor ?? colors.accent;
  const from = gradientFrom ?? colors.titleGradientFrom ?? fallback;
  const to = gradientTo ?? colors.titleGradientTo ?? fallback;

  return (
    <View
      {...props}
      className={[isCompact ? "gap-2" : "gap-3", className].filter(Boolean).join(" ")}
    >
      <View
        className="flex-row items-center"
        style={{ columnGap: isCompact ? 6 : 12, flexWrap: "nowrap" }}
      >
        <View className="min-w-0 flex-1">
          <ThemedText
            type="heading"
            numberOfLines={1}
            ellipsizeMode="tail"
            className={titleClassName}
          >
            {title}
          </ThemedText>
        </View>
        {right ? (
          <View
            className="min-w-0"
            style={{ flexShrink: 1, maxWidth: isCompact ? "62%" : "68%" }}
          >
            {right}
          </View>
        ) : null}
      </View>

      {showDivider ? (
        <View className="h-[2px] overflow-hidden rounded-full">
          <LinearGradient
            colors={[from, to, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </View>
      ) : null}
    </View>
  );
}
