import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/shared/themed-text";
import { Button } from "@/components/shared/ui/Button";
import { Card } from "@/components/shared/ui/Card";
import { FieldInput } from "@/components/shared/ui/FieldInput";
import { listGoogleSpreadsheets, type GoogleSpreadsheetFile } from "@/lib/googleDrive";
import {
  createGoogleSpreadsheet,
  ensureInvoicesTab,
} from "@/lib/googleSheets";
import type { SelectedGoogleSpreadsheet } from "@/lib/googleSheetSelection";
import { getGoogleAccessToken } from "@/lib/googleAuth";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import { getIntlLocale } from "@/lib/i18n";

type PickerMode = "existing" | "new";

type GoogleSheetPickerModalProps = {
  onClose: () => void;
  onSelected: (selection: SelectedGoogleSpreadsheet) => void;
  visible: boolean;
};

function formatModifiedTime(value: string | undefined, locale: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale);
}

export function GoogleSheetPickerModal({
  onClose,
  onSelected,
  visible,
}: GoogleSheetPickerModalProps) {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const locale = getIntlLocale(i18n.resolvedLanguage ?? i18n.language);
  const defaultSheetTitle = t("settings.googleDefaultSpreadsheetTitle");
  const [mode, setMode] = useState<PickerMode>("existing");
  const [sheets, setSheets] = useState<GoogleSpreadsheetFile[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [isSelectingSheet, setIsSelectingSheet] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSheetTitle, setNewSheetTitle] = useState(defaultSheetTitle);

  const canCreate = useMemo(
    () => newSheetTitle.trim().length > 0 && !isCreatingSheet,
    [isCreatingSheet, newSheetTitle],
  );

  const loadSheets = useCallback(async () => {
    if (!visible) {
      return;
    }

    setIsLoadingSheets(true);
    setError(null);

    try {
      const accessToken = await getGoogleAccessToken();
      setSheets(await listGoogleSpreadsheets(accessToken));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("settings.googleSheetPickerLoadFailed"),
      );
    } finally {
      setIsLoadingSheets(false);
    }
  }, [t, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setMode("existing");
    setNewSheetTitle(defaultSheetTitle);
    void loadSheets();
  }, [defaultSheetTitle, loadSheets, visible]);

  async function handleSelectSheet(sheet: GoogleSpreadsheetFile) {
    setIsSelectingSheet(true);
    setError(null);

    try {
      const accessToken = await getGoogleAccessToken();
      await ensureInvoicesTab(accessToken, sheet.id);
      onSelected({
        selectedAt: new Date().toISOString(),
        spreadsheetId: sheet.id,
        spreadsheetName: sheet.name,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("settings.googleSheetPickerSelectFailed"),
      );
    } finally {
      setIsSelectingSheet(false);
    }
  }

  async function handleCreateSheet() {
    if (!canCreate) {
      return;
    }

    setIsCreatingSheet(true);
    setError(null);

    try {
      const accessToken = await getGoogleAccessToken();
      const created = await createGoogleSpreadsheet(
        accessToken,
        newSheetTitle,
      );
      await ensureInvoicesTab(accessToken, created.spreadsheetId);
      onSelected({
        selectedAt: new Date().toISOString(),
        spreadsheetId: created.spreadsheetId,
        spreadsheetName: created.spreadsheetName,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("settings.googleSheetPickerCreateFailed"),
      );
    } finally {
      setIsCreatingSheet(false);
    }
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: colors.scrim }}
      >
        <Pressable className="flex-1" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={20}
        >
          <Card className="max-h-[86%] rounded-t-3xl border px-5 pb-6 pt-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="min-w-0 flex-1">
                <ThemedText type="subtitle">
                  {t("settings.googleSheetPickerTitle")}
                </ThemedText>
                <ThemedText className="mt-2" style={{ color: colors.muted }}>
                  {t("settings.googleSheetPickerHint")}
                </ThemedText>
              </View>
              <Button
                label={t("common.close")}
                size="sm"
                variant="secondary"
                onPress={onClose}
              />
            </View>

            <View
              className="mt-4 flex-row rounded-full border p-1"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.background,
              }}
            >
              {(["existing", "new"] as const).map((nextMode) => {
                const isActive = mode === nextMode;
                return (
                  <Pressable
                    key={nextMode}
                    className="flex-1 rounded-full px-3 py-2"
                    onPress={() => setMode(nextMode)}
                    style={{
                      backgroundColor: isActive ? colors.accent : "transparent",
                    }}
                  >
                    <ThemedText
                      style={{
                        color: isActive ? colors.onAccent : colors.muted,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    >
                      {nextMode === "existing"
                        ? t("settings.googleSheetPickerExisting")
                        : t("settings.googleSheetPickerNew")}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {error ? (
              <ThemedText className="mt-3" style={{ color: colors.danger }}>
                {error}
              </ThemedText>
            ) : null}

            {mode === "existing" ? (
              <View className="mt-4 min-h-[260px]">
                {isLoadingSheets ? (
                  <View className="items-center gap-3 py-10">
                    <ActivityIndicator color={colors.accent} />
                    <ThemedText style={{ color: colors.muted }}>
                      {t("settings.googleSheetPickerLoading")}
                    </ThemedText>
                  </View>
                ) : sheets.length === 0 ? (
                  <View className="items-center gap-3 py-8">
                    <ThemedText style={{ color: colors.muted }}>
                      {t("settings.googleSheetPickerEmpty")}
                    </ThemedText>
                    <Button
                      label={t("settings.googleSheetPickerRefresh")}
                      size="sm"
                      variant="secondary"
                      onPress={() => void loadSheets()}
                    />
                  </View>
                ) : (
                  <ScrollView
                    contentContainerClassName="gap-3 pb-2"
                    showsVerticalScrollIndicator={false}
                  >
                    {sheets.map((sheet) => (
                      <Pressable
                        key={sheet.id}
                        className="rounded-2xl border px-4 py-3"
                        disabled={isSelectingSheet}
                        onPress={() => void handleSelectSheet(sheet)}
                        style={({ pressed }) => ({
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                          opacity: isSelectingSheet ? 0.5 : pressed ? 0.85 : 1,
                        })}
                      >
                        <ThemedText type="defaultSemiBold">
                          {sheet.name}
                        </ThemedText>
                        {sheet.modifiedTime ? (
                          <ThemedText
                            className="mt-1"
                            style={{ color: colors.muted }}
                          >
                            {formatModifiedTime(sheet.modifiedTime, locale)}
                          </ThemedText>
                        ) : null}
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View className="mt-4 gap-4">
                <FieldInput
                  autoCapitalize="words"
                  label={t("settings.googleSheetPickerCreateName")}
                  value={newSheetTitle}
                  onChangeText={setNewSheetTitle}
                />
                <Button
                  disabled={!canCreate}
                  label={t("settings.googleSheetPickerCreate")}
                  loading={isCreatingSheet}
                  onPress={() => void handleCreateSheet()}
                />
              </View>
            )}
          </Card>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
