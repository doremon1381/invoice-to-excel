import type { ComponentProps } from "react";
import { View, type ViewProps } from "react-native";

import { ThemedText } from "@/components/shared/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";

import { IconSymbol } from "./icon-symbol";

type IconSectionTitleProps = ViewProps & {
  title: string;
  iconName: ComponentProps<typeof IconSymbol>["name"];
  iconColor: ComponentProps<typeof IconSymbol>["color"];
  iconSize?: number;
  titleClassName?: string;
  iconContainerClassName?: string;
};

export function IconSectionTitle({
  title,
  iconName,
  iconColor,
  iconSize = 14,
  titleClassName,
  iconContainerClassName,
  className,
  ...props
}: IconSectionTitleProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      {...props}
      className={["flex-row items-center gap-2", className].filter(Boolean).join(" ")}
    >
      <View
        className={[
          "h-8 w-8 items-center justify-center rounded-full border",
          iconContainerClassName,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <IconSymbol color={iconColor} name={iconName} size={iconSize} />
      </View>
      <ThemedText
        type="heading"
        className={["min-w-0 flex-1", titleClassName].filter(Boolean).join(" ")}
        numberOfLines={1}
        scaleRole="chrome"
      >
        {title}
      </ThemedText>
    </View>
  );
}
