import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, View } from "react-native";
import { useState } from "react";

import { ThemedText } from "@/components/shared/themed-text";
import { Button } from "@/components/shared/ui/Button";
import { Card } from "@/components/shared/ui/Card";
import { FieldInput } from "@/components/shared/ui/FieldInput";
import { ScreenContainer } from "@/components/shared/ui/ScreenContainer";
import { SectionTitle } from "@/components/shared/ui/SectionTitle";
import { Colors } from "@/constants/theme";
import { useGoogleSheetsConfig } from "@/hooks/settings/useGoogleSheetsConfig";
import { useGoogleAuth } from "@/hooks/settings/useGoogleAuth";
import { useAppTheme } from "@/hooks/theme/theme-provider";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import { verifySpreadsheetAccess } from "@/lib/googleSheets";
import { i18n } from "@/lib/i18n";
import { Storage, type AppLocale } from "@/lib/storage";

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { colorScheme: themeMode, setThemeMode } = useAppTheme();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showSpreadsheetId, setShowSpreadsheetId] = useState(false);
  const {
    account,
    error: googleAuthError,
    isLoading: isGoogleAuthLoading,
    isSigningIn,
    signIn,
    signOut,
  } = useGoogleAuth();
  const {
    isLoading: isGoogleSheetsLoading,
    saveSpreadsheetId,
    saveTabName,
    spreadsheetId,
    tabName,
  } = useGoogleSheetsConfig();
  const activeLocale: AppLocale = i18n.resolvedLanguage
    ?.toLowerCase()
    .startsWith("vi")
    ? "vi"
    : "en";
  const isGoogleConfigLoading = isGoogleAuthLoading || isGoogleSheetsLoading;

  async function setLocale(locale: AppLocale) {
    await i18n.changeLanguage(locale);
    await Storage.setAppLocale(locale);
  }

  async function handleTestGoogleConnection() {
    if (!account) {
      Alert.alert(
        t("settings.googleAuthRequiredTitle"),
        t("settings.googleAuthRequiredMessage"),
      );
      return;
    }

    if (!spreadsheetId.trim()) {
      Alert.alert(
        t("settings.googleSpreadsheetRequiredTitle"),
        t("settings.googleSpreadsheetRequiredMessage"),
      );
      return;
    }

    setIsTestingConnection(true);
    try {
      const result = await verifySpreadsheetAccess({
        spreadsheetId,
        tab: tabName,
      });

      if (!result.tabExists) {
        Alert.alert(
          t("settings.googleSheetTabMissingTitle"),
          t("settings.googleSheetTabMissingMessage", { tabName }),
        );
        return;
      }

      Alert.alert(
        t("settings.googleConnectionSuccessTitle"),
        t("settings.googleConnectionSuccessMessage", { title: result.title }),
      );
    } catch (caughtError) {
      Alert.alert(
        t("settings.googleConnectionFailedTitle"),
        caughtError instanceof Error
          ? caughtError.message
          : t("settings.googleConnectionFailedMessage"),
      );
    } finally {
      setIsTestingConnection(false);
    }
  }

  return (
    <ScreenContainer scroll className="mb-5">
      <SectionTitle
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />

      <Card className="mt-4 rounded-[28px] border py-5 px-4">
        <ThemedText type="defaultSemiBold">
          {t("settings.appearance")}
        </ThemedText>
        <View
          className="mt-4 flex-row rounded-full border p-1"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          {(["light", "dark"] as const).map((mode) => {
            const isActive = themeMode === mode;

            return (
              <Pressable
                key={mode}
                className="flex-1 rounded-full px-4 py-3"
                onPress={() => void setThemeMode(mode)}
                style={{
                  backgroundColor: isActive ? colors.accent : "transparent",
                }}
              >
                <ThemedText
                  style={{
                    color: isActive ? colors.background : colors.muted,
                    fontWeight: "700",
                    textAlign: "center",
                    textTransform: "capitalize",
                  }}
                >
                  {mode === "light"
                    ? t("settings.lightMode")
                    : t("settings.darkMode")}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card className="mt-4 rounded-[28px] border py-5 px-4">
        <ThemedText type="defaultSemiBold">{t("settings.language")}</ThemedText>
        <View
          className="mt-4 flex-row rounded-full border p-1"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          {(["en", "vi"] as const).map((locale) => {
            const isActive = activeLocale === locale;

            return (
              <Pressable
                key={locale}
                className="flex-1 rounded-full px-4 py-3"
                onPress={() => void setLocale(locale)}
                style={{
                  backgroundColor: isActive ? colors.accent : "transparent",
                }}
              >
                <ThemedText
                  style={{
                    color: isActive ? colors.background : colors.muted,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {locale === "en"
                    ? t("settings.english")
                    : t("settings.vietnamese")}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* TODO: Add AI extraction card later */}
      {/* <Card className="mt-5 rounded-[28px] border p-5">
        <ThemedText type="defaultSemiBold">{t("settings.aiExtraction")}</ThemedText>
        <ThemedText className="mt-2" style={{ color: colors.muted }}>
          {t("settings.aiExtractionBody", {
            endpoint: OPENAI_BASE_URL,
            model: OPENAI_MODEL,
          })}
        </ThemedText>
      </Card> */}

      <Card className="mt-5 rounded-[28px] border p-5">
        <ThemedText type="defaultSemiBold">{t("settings.googleSheets")}</ThemedText>
        <ThemedText className="mt-2" style={{ color: colors.muted }}>
          {t("settings.googleSheetsDescription")}
        </ThemedText>

        <View className="mt-4 gap-3">
          {account ? (
            <View
              className="rounded-2xl border px-4 py-3"
              style={{ borderColor: colors.border, backgroundColor: colors.surface }}
            >
              <ThemedText type="defaultSemiBold">
                {t("settings.googleSignedInAs", {
                  email: account.email ?? t("settings.googleUnknownEmail"),
                })}
              </ThemedText>
              <View className="mt-3">
                <Button
                  label={t("settings.googleSignOut")}
                  size="sm"
                  variant="secondary"
                  onPress={() => void signOut()}
                />
              </View>
            </View>
          ) : (
            <Button
              disabled={isGoogleConfigLoading || isSigningIn}
              label={t("settings.googleSignIn")}
              loading={isSigningIn}
              onPress={() => void signIn()}
            />
          )}

          {googleAuthError ? (
            <ThemedText style={{ color: colors.danger }}>{googleAuthError}</ThemedText>
          ) : null}

          <FieldInput
            autoCapitalize="none"
            autoCorrect={false}
            label={t("settings.googleSpreadsheetId")}
            secureTextEntry={!showSpreadsheetId}
            value={spreadsheetId}
            onChangeText={(value) => void saveSpreadsheetId(value)}
            trailing={
              <Pressable onPress={() => setShowSpreadsheetId((current) => !current)}>
                <ThemedText style={{ color: colors.accent }}>
                  {showSpreadsheetId
                    ? t("settings.googleHideSpreadsheetId")
                    : t("settings.googleShowSpreadsheetId")}
                </ThemedText>
              </Pressable>
            }
          />
          <FieldInput
            autoCapitalize="none"
            autoCorrect={false}
            label={t("settings.googleTabName")}
            value={tabName}
            onChangeText={(value) => void saveTabName(value)}
          />
          <Button
            disabled={isTestingConnection || isGoogleConfigLoading || !account}
            label={t("settings.googleTestConnection")}
            loading={isTestingConnection}
            variant="secondary"
            onPress={() => void handleTestGoogleConnection()}
          />
        </View>
      </Card>

      <Card className="mt-5 rounded-[28px] border p-5">
        <ThemedText type="defaultSemiBold">{t("settings.database")}</ThemedText>
        <ThemedText className="mt-2" style={{ color: colors.muted }}>
          {t("settings.databaseDescription")}
        </ThemedText>
        <Pressable
          className="mt-4 min-h-[52px] items-center justify-center rounded-2xl px-4 py-4"
          style={({ pressed }) => ({
            backgroundColor: colors.accent,
            opacity: pressed ? 0.85 : 1,
          })}
          onPress={() => router.push("/(tabs)/settings/database-management")}
        >
          <ThemedText style={{ color: colors.foreground }}>
            {t("settings.openDatabaseManagement")}
          </ThemedText>
        </Pressable>
      </Card>
    </ScreenContainer>
  );
}
