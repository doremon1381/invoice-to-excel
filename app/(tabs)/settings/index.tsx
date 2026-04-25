import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { GoogleSheetPickerModal } from "@/components/settings/GoogleSheetPickerModal";
import { ThemedText } from "@/components/shared/themed-text";
import { Button } from "@/components/shared/ui/Button";
import { Card } from "@/components/shared/ui/Card";
import { IconSectionTitle } from "@/components/shared/ui/IconSectionTitle";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { PageTitle } from "@/components/shared/ui/PageTitle";
import { ScreenContainer } from "@/components/shared/ui/ScreenContainer";
import { Colors } from "@/constants/theme";
import { useGoogleAuth } from "@/hooks/settings/useGoogleAuth";
import { useAppTheme } from "@/hooks/theme/theme-provider";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import {
  clearSelectedSpreadsheet,
  getSelectedSpreadsheet,
  saveSelectedSpreadsheet,
  type SelectedGoogleSpreadsheet,
} from "@/lib/googleSheetSelection";
import { i18n } from "@/lib/i18n";
import { Storage, type AppLocale } from "@/lib/storage";

type SettingToggleOption = {
  key: string;
  label: string;
  active: boolean;
  onPress: () => void;
};

const SETTING_OPTION_HORIZONTAL_PADDING = 12;

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { colorScheme: themeMode, setThemeMode } = useAppTheme();
  const [selectedSpreadsheet, setSelectedSpreadsheet] =
    useState<SelectedGoogleSpreadsheet | null>(null);
  const [isSheetPickerVisible, setIsSheetPickerVisible] = useState(false);
  const [maxSettingLabelWidth, setMaxSettingLabelWidth] = useState(0);
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

  async function handleGoogleSignOut() {
    await signOut();
    await clearSelectedSpreadsheet();
    setSelectedSpreadsheet(null);
    setIsSheetPickerVisible(false);
  }

  async function handleClearSelectedSheet() {
    await clearSelectedSpreadsheet();
    setSelectedSpreadsheet(null);
    setIsSheetPickerVisible(false);
  }

  const handleMeasureSettingLabel = useCallback((width: number) => {
    const roundedWidth = Math.ceil(width);
    setMaxSettingLabelWidth((current) =>
      roundedWidth > current ? roundedWidth : current,
    );
  }, []);

  const settingOptionWidth =
    maxSettingLabelWidth > 0
      ? maxSettingLabelWidth + SETTING_OPTION_HORIZONTAL_PADDING * 2
      : undefined;

  return (
    <ScreenContainer scroll safeAreaTop={false}>
      <PageTitle title={t("settings.title")} />

      <View className="mt-5 gap-3 rounded-2xl bg-surface p-4 dark:bg-surface-dark">
        <SettingToggleRow
          colors={colors}
          label={t("settings.appearance")}
          onMeasureLabelWidth={handleMeasureSettingLabel}
          optionWidth={settingOptionWidth}
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

        <View className="h-px bg-divider dark:bg-divider-dark" />

        <SettingToggleRow
          colors={colors}
          label={t("settings.language")}
          onMeasureLabelWidth={handleMeasureSettingLabel}
          optionWidth={settingOptionWidth}
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

      <View className="mt-6 gap-2">
        <IconSectionTitle
          iconColor={colors.accent}
          iconName="tablecells.fill"
          title={t("settings.googleSheets")}
        />
        <ThemedText
          className="pl-10"
          scaleRole="body"
          style={{ color: colors.muted }}
          type="body"
        >
          {t("settings.googleSheetsDescription")}
        </ThemedText>
      </View>

      <Card className="mt-4 rounded-[28px] border p-5">
        <View className="gap-3">
          {account ? (
            <View style={styles.googleSheetStack}>
              <GoogleSheetInfoBox
                action={
                  <Pressable
                    accessibilityLabel={t("settings.googleClearAccountA11y")}
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => void handleGoogleSignOut()}
                    style={({ pressed }) => [
                      styles.googleSheetIconButton,
                      { opacity: pressed ? 0.82 : 1 },
                    ]}
                  >
                    <IconSymbol
                      color={Colors.dark.foreground}
                      name="xmark"
                      size={18}
                    />
                  </Pressable>
                }
                label={t("settings.googleAccountLabel")}
                value={account.email ?? t("settings.googleUnknownEmail")}
              />

              <GoogleSheetInfoBox
                action={
                  selectedSpreadsheet ? (
                    <Pressable
                      accessibilityLabel={t("settings.googleClearSelectedSheetA11y")}
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={(event) => {
                        event.stopPropagation();
                        void handleClearSelectedSheet();
                      }}
                      style={({ pressed }) => [
                        styles.googleSheetIconButton,
                        { opacity: pressed ? 0.82 : 1 },
                      ]}
                    >
                      <IconSymbol
                        color={Colors.dark.foreground}
                        name="xmark"
                        size={18}
                      />
                    </Pressable>
                  ) : null
                }
                label={t("settings.googleSelectedSheetLabel")}
                onPress={() => setIsSheetPickerVisible(true)}
                value={
                  selectedSpreadsheet?.spreadsheetName ??
                  t("settings.googleNoCurrentSheet")
                }
              />
            </View>
          ) : (
            <View style={styles.googleSheetStack}>
              <Button
                disabled={isGoogleConfigLoading || isSigningIn}
                label={t("settings.googleSignIn")}
                loading={isSigningIn}
                onPress={() => void handleSignIn()}
                style={styles.googleSheetPrimaryButton}
              />
              <GoogleSheetInfoBox
                disabled
                value={t("settings.googleChooseOrCreateSheet")}
              />
            </View>
          )}

          {googleAuthError ? (
            <ThemedText style={{ color: colors.danger }}>{googleAuthError}</ThemedText>
          ) : null}
        </View>
      </Card>

      <View className="mt-6 gap-2">
        <IconSectionTitle
          iconColor={colors.accent}
          iconName="externaldrive.fill"
          title={t("settings.database")}
        />
      </View>

      <Card className="mt-4 rounded-[28px] border p-5">
        <Button
          label={t("settings.openDatabaseManagement")}
          onPress={() => router.push("/(tabs)/settings/database-management")}
        />
      </Card>

      <GoogleSheetPickerModal
        visible={isSheetPickerVisible}
        onClose={() => setIsSheetPickerVisible(false)}
        onSelected={(selection) => void handleSpreadsheetSelected(selection)}
      />
    </ScreenContainer>
  );
}

function GoogleSheetInfoBox({
  action,
  disabled = false,
  label,
  onPress,
  value,
}: {
  action?: ReactNode;
  disabled?: boolean;
  label?: string;
  onPress?: () => void;
  value: string;
}) {
  const boxColors = Colors.dark;
  const isCenterContent = !label && !action;

  if (isCenterContent) {
    return (
      <View
        style={[
          styles.googleSheetInfoBox,
          styles.googleSheetInfoBoxCentered,
          {
            backgroundColor: boxColors.surfaceAlt,
            borderColor: boxColors.border,
            opacity: disabled ? 0.72 : 1,
          },
        ]}
      >
        <ThemedText
          className="text-base font-bold"
          numberOfLines={2}
          scaleRole="chrome"
          style={[styles.googleSheetCenteredText, { color: boxColors.foreground }]}
          type="custom"
        >
          {value}
        </ThemedText>
      </View>
    );
  }

  const content = (
    <View style={styles.googleSheetBoxInner}>
      <View style={styles.googleSheetTextWrap}>
        {label ? (
          <ThemedText
            className="text-caption font-semibold"
            numberOfLines={1}
            scaleRole="chrome"
            style={{ color: boxColors.mutedLight }}
            type="custom"
          >
            {label}
          </ThemedText>
        ) : null}
        <ThemedText
          className={label ? "mt-1 text-base font-bold" : "text-base font-bold"}
          numberOfLines={2}
          scaleRole="chrome"
          style={{ color: boxColors.foreground }}
          type="custom"
        >
          {value}
        </ThemedText>
      </View>
      {action ? <View style={styles.googleSheetActionWrap}>{action}</View> : null}
    </View>
  );

  if (disabled || !onPress) {
    return (
      <View
        style={[
          styles.googleSheetInfoBox,
          {
            backgroundColor: boxColors.surfaceAlt,
            borderColor: boxColors.border,
            opacity: disabled ? 0.72 : 1,
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.googleSheetInfoBox,
        {
          backgroundColor: boxColors.surfaceAlt,
          borderColor: boxColors.border,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      {content}
    </Pressable>
  );
}

function SettingToggleRow({
  colors,
  label,
  onMeasureLabelWidth,
  optionWidth,
  options,
}: {
  colors: (typeof Colors)[keyof typeof Colors];
  label: string;
  onMeasureLabelWidth: (width: number) => void;
  optionWidth?: number;
  options: SettingToggleOption[];
}) {
  return (
    <View style={styles.settingRow}>
      <ThemedText className="font-semibold" scaleRole="chrome" type="custom">
        {label}
      </ThemedText>
      <View
        className="flex-row rounded-full p-1"
        style={{ backgroundColor: colors.surfaceAlt }}
      >
        {options.map((option) => (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={option.active ? { selected: true } : {}}
            onPress={option.onPress}
            style={({ pressed }) => [
              styles.settingOption,
              optionWidth ? { width: optionWidth } : null,
              {
                backgroundColor: option.active ? colors.accent : "transparent",
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <ThemedText
              className="font-semibold"
              numberOfLines={1}
              onLayout={({ nativeEvent }) =>
                onMeasureLabelWidth(nativeEvent.layout.width)
              }
              scaleRole="chrome"
              style={{
                color: option.active ? colors.onAccent : colors.mutedLight,
                textAlign: "center",
              }}
              type="custom"
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
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  settingOption: {
    alignItems: "center",
    borderRadius: 16,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: SETTING_OPTION_HORIZONTAL_PADDING,
    paddingVertical: 6,
  },
  googleSheetActionWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    width: 32,
  },
  googleSheetBoxInner: {
    alignItems: "center",
    flexDirection: "row",
  },
  googleSheetInfoBoxCentered: {
    alignItems: "center",
    justifyContent: "center",
  },
  googleSheetCenteredText: {
    textAlign: "center",
  },
  googleSheetIconButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  googleSheetInfoBox: {
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  googleSheetStack: {
    gap: 10,
  },
  googleSheetPrimaryButton: {
    borderRadius: 18,
    minHeight: 76,
  },
  googleSheetTextWrap: {
    flex: 1,
    minWidth: 0,
  },
});
