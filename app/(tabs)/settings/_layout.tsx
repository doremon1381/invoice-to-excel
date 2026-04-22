import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

import { Colors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";

export default function SettingsLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTitleStyle: {
          color: colors.foreground,
          fontSize: Typography.xl.size,
          fontWeight: "700",
        },
        headerTintColor: colors.foreground,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: t("tabs.settings") }} />
      <Stack.Screen
        name="database-management"
        options={{ title: t("stack.databaseManagement") }}
      />
    </Stack>
  );
}
