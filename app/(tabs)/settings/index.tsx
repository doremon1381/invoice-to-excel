import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useCallback, useEffect, useState } from "react";

import { GoogleSheetPickerModal } from "@/components/settings/GoogleSheetPickerModal";
import { ThemedText } from "@/components/shared/themed-text";
import { Button } from "@/components/shared/ui/Button";
import { Card } from "@/components/shared/ui/Card";
import { ScreenContainer } from "@/components/shared/ui/ScreenContainer";
import { SectionTitle } from "@/components/shared/ui/SectionTitle";
import { Colors } from "@/constants/theme";
import { useGoogleAuth } from "@/hooks/settings/useGoogleAuth";
import { useAppTheme } from "@/hooks/theme/theme-provider";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import {
  getSelectedSpreadsheet,
  saveSelectedSpreadsheet,
  type SelectedGoogleSpreadsheet,
} from "@/lib/googleSheetSelection";
import { i18n } from "@/lib/i18n";
import { Storage, type AppLocale } from "@/lib/storage";

type SettingsPalette = (typeof Colors)[keyof typeof Colors];
type PreferenceOption = {
  key: string;
  label: string;
  active: boolean;
  onPress: () => void;
};

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { colorScheme: themeMode, setThemeMode } = useAppTheme();
  const [selectedSpreadsheet, setSelectedSpreadsheet] =
    useState<SelectedGoogleSpreadsheet | null>(null);
  const [isSheetPickerVisible, setIsSheetPickerVisible] = useState(false);
  const {
    account,
    error: googleAuthError,
    isLoading: isGoogleAuthLoading,
    isSigningIn,
    signIn,
    signOut,
  } = useGoogleAuth();
  const activeLocale: AppLocale = i18n.resolvedLanguage
    ?.toLowerCase()
    .startsWith("vi")
    ? "vi"
    : "en";
  const isGoogleConfigLoading = isGoogleAuthLoading;

  const loadSelectedSpreadsheet = useCallback(async () => {
    setSelectedSpreadsheet(await getSelectedSpreadsheet());
  }, []);

  useEffect(() => {
    void loadSelectedSpreadsheet();
  }, [loadSelectedSpreadsheet]);

  async function setLocale(locale: AppLocale) {
    await i18n.changeLanguage(locale);
    await Storage.setAppLocale(locale);
  }

  async function handleSignIn() {
    const nextAccount = await signIn();
    if (nextAccount) {
      Alert.alert(
        t("settings.googleSignInSuccessTitle"),
        t("settings.googleSignInSuccessMessage", {
          email: nextAccount.email ?? t("settings.googleUnknownEmail"),
        }),
      );
    }
  }

  async function handleSpreadsheetSelected(selection: SelectedGoogleSpreadsheet) {
    const savedSelection = await saveSelectedSpreadsheet(selection);
    setSelectedSpreadsheet(savedSelection);
    setIsSheetPickerVisible(false);
    Alert.alert(
      t("settings.googleSheetSelectedTitle"),
      t("settings.googleSheetSelectedMessage", {
        name: savedSelection.spreadsheetName,
      }),
    );
  }

  return (
    <ScreenContainer scroll>
      <SectionTitle
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />

      <Card className="mt-4 rounded-[28px] border p-4">
        <View style={styles.preferenceGroup}>
          <PreferenceRow
            colors={colors}
            label={t("settings.appearance")}
            options={[
              {
                key: "light",
                label: t("settings.lightMode"),
                active: themeMode === "light",
                onPress: () => void setThemeMode("light"),
              },
              {
                key: "dark",
                label: t("settings.darkMode"),
                active: themeMode === "dark",
                onPress: () => void setThemeMode("dark"),
              },
            ]}
          />
          <View
            style={[
              styles.preferenceDivider,
              { backgroundColor: colors.divider },
            ]}
          />
          <PreferenceRow
            colors={colors}
            label={t("settings.language")}
            options={[
              {
                key: "vi",
                label: t("settings.vietnamese"),
                active: activeLocale === "vi",
                onPress: () => void setLocale("vi"),
              },
              {
                key: "en",
                label: t("settings.english"),
                active: activeLocale === "en",
                onPress: () => void setLocale("en"),
              },
            ]}
          />
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
              onPress={() => void handleSignIn()}
            />
          )}

          {googleAuthError ? (
            <ThemedText style={{ color: colors.danger }}>{googleAuthError}</ThemedText>
          ) : null}

          <View
            className="rounded-2xl border px-4 py-3"
            style={{ borderColor: colors.border, backgroundColor: colors.background }}
          >
            <ThemedText style={{ color: colors.muted }}>
              {t("settings.googleCurrentSheet")}
            </ThemedText>
            <ThemedText className="mt-1" type="defaultSemiBold">
              {selectedSpreadsheet?.spreadsheetName ??
                t("settings.googleNoCurrentSheet")}
            </ThemedText>
          </View>

          {!account ? (
            <ThemedText style={{ color: colors.muted }}>
              {t("settings.googleChooseSheetSignInFirst")}
            </ThemedText>
          ) : null}

          <Button
            disabled={isGoogleConfigLoading || !account}
            label={
              selectedSpreadsheet
                ? t("settings.googleChangeSheet")
                : t("settings.googleChooseOrCreateSheet")
            }
            variant="secondary"
            onPress={() => setIsSheetPickerVisible(true)}
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

      <GoogleSheetPickerModal
        visible={isSheetPickerVisible}
        onClose={() => setIsSheetPickerVisible(false)}
        onSelected={(selection) => void handleSpreadsheetSelected(selection)}
      />
    </ScreenContainer>
  );
}

function PreferenceRow({
  colors,
  label,
  options,
}: {
  colors: SettingsPalette;
  label: string;
  options: PreferenceOption[];
}) {
  return (
    <View style={styles.preferenceRow}>
      <View style={styles.preferenceLabelWrap}>
        <ThemedText style={styles.preferenceLabel} type="defaultSemiBold">
          {label}
        </ThemedText>
      </View>

      <View
        style={[
          styles.preferencePill,
          {
            backgroundColor: colors.surfaceAlt,
          },
        ]}
      >
        {options.map((option) => (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={option.active ? { selected: true } : {}}
            onPress={option.onPress}
            style={({ pressed }) => [
              styles.preferenceOption,
              {
                backgroundColor: option.active ? colors.accent : "transparent",
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <ThemedText
              style={{
                color: option.active ? colors.onAccent : colors.mutedLight,
                fontWeight: "700",
                textAlign: "center",
              }}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preferenceGroup: {
    gap: 12,
  },
  preferenceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  preferenceLabelWrap: {
    flex: 1,
  },
  preferenceLabel: {
    lineHeight: 20,
  },
  preferenceDivider: {
    height: StyleSheet.hairlineWidth,
  },
  preferencePill: {
    borderRadius: 999,
    flexDirection: "row",
    padding: 4,
  },
  preferenceOption: {
    borderRadius: 999,
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
