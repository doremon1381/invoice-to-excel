import "../global.css";

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { I18nHydrate } from "@/hooks/locale/I18nHydrate";
import { AppThemeProvider, useAppTheme } from "@/hooks/theme/theme-provider";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import { initializeDatabase } from "@/lib/db";
import { i18n } from "@/lib/i18n";

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if splash is already prevented/hidden in dev reload paths.
});

export const unstable_settings = {
  anchor: "(tabs)",
};

function RootNavigator() {
  const colorScheme = useColorScheme() ?? "light";
  const { t } = useTranslation();
  const colors = Colors[colorScheme];

  useEffect(() => {
    void initializeDatabase();
  }, []);

  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: colors.background,
        border: colors.border,
        card: colors.background,
        notification: colors.accent,
        primary: colors.accent,
        text: colors.foreground,
      },
    };
  }, [colorScheme, colors.accent, colors.background, colors.border, colors.foreground]);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="invoice/[id]"
          options={{ headerShown: false, title: t("stack.invoiceDetail") }}
        />
      </Stack>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

function AppBootstrap({ i18nReady }: { i18nReady: boolean }) {
  const { isLoaded } = useAppTheme();

  useEffect(() => {
    if (!isLoaded || !i18nReady) {
      return;
    }

    void SplashScreen.hideAsync();
  }, [i18nReady, isLoaded]);

  if (!isLoaded || !i18nReady) {
    return null;
  }

  return <RootNavigator />;
}

export default function RootLayout() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <I18nextProvider i18n={i18n}>
          <I18nHydrate onReady={() => setIsI18nReady(true)} />
          <AppBootstrap i18nReady={isI18nReady} />
        </I18nextProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
