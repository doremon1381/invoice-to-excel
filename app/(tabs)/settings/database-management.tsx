import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/shared/themed-text";
import { Button } from "@/components/shared/ui/Button";
import { Card } from "@/components/shared/ui/Card";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { LoadingState } from "@/components/shared/ui/LoadingState";
import { ScreenContainer } from "@/components/shared/ui/ScreenContainer";
import { SectionTitle } from "@/components/shared/ui/SectionTitle";
import { Colors } from "@/constants/theme";
import { useInvoiceExport } from "@/hooks/invoice/useInvoiceExport";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import { deleteNonFinalInvoices, getInvoiceCount } from "@/lib/db";
import { getIntlLocale } from "@/lib/i18n";
import { Storage } from "@/lib/storage";
import type { ExportHistoryEntry } from "@/lib/types";

export default function DatabaseManagementScreen() {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const locale = getIntlLocale(i18n.resolvedLanguage ?? i18n.language);
  const { exportAll, isExporting } = useInvoiceExport();
  const [recordCount, setRecordCount] = useState(0);
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurging, setIsPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [count, storedHistory] = await Promise.all([
        getInvoiceCount(),
        Storage.getExportHistory(),
      ]);
      setRecordCount(count);
      setHistory(storedHistory);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("database.loadError"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const storageSize = useMemo(
    () => `${Math.max(recordCount * 0.24, 0.12).toFixed(2)} MB`,
    [recordCount],
  );
  const recentExports = useMemo(() => history.slice(0, 4), [history]);
  const shortDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
      }),
    [locale],
  );
  const shortDateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      }),
    [locale],
  );

  async function handleExport() {
    try {
      await exportAll();
      await loadData();
    } catch (caughtError) {
      Alert.alert(
        t("database.alertExportFailed"),
        caughtError instanceof Error
          ? caughtError.message
          : t("database.alertExportFailedMessage"),
      );
    }
  }

  function handlePurgeNonFinalInvoices() {
    Alert.alert(t("database.alertPurgeTitle"), t("database.alertPurgeMessage"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          void (async () => {
            setIsPurging(true);
            try {
              const deletedCount = await deleteNonFinalInvoices();
              await loadData();
              Alert.alert(
                t("database.alertCleanupComplete"),
                t("database.alertCleanupCompleteMessage", { count: deletedCount }),
              );
            } catch (caughtError) {
              Alert.alert(
                t("database.alertCleanupFailed"),
                caughtError instanceof Error
                  ? caughtError.message
                  : t("database.alertCleanupFailedMessage"),
              );
            } finally {
              setIsPurging(false);
            }
          })();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <ScreenContainer padded={false}>
        <LoadingState message={t("database.loadingMetrics")} />
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <ErrorState message={error} onRetry={() => void loadData()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <SectionTitle
        title={t("database.title")}
        description={t("database.subtitle")}
      />

      <Card className="mt-5 rounded-[28px] border p-5">
        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-2xl border px-4 py-4"
            style={{ borderColor: colors.border }}
          >
            <ThemedText
              className="text-caption font-semibold"
              style={{ color: colors.muted }}
            >
              {t("database.totalRecords")}
            </ThemedText>
            <ThemedText
              type="custom"
              className="mt-2 text-display font-bold"
            >
              {recordCount}
            </ThemedText>
            <ThemedText className="text-xs" style={{ color: colors.muted }}>
              {t("database.invoicesStoredLocally")}
            </ThemedText>
          </View>
          <View
            className="flex-1 rounded-2xl border px-4 py-4"
            style={{ borderColor: colors.border }}
          >
            <ThemedText
              className="text-caption font-semibold"
              style={{ color: colors.muted }}
            >
              {t("database.storageSize")}
            </ThemedText>
            <ThemedText
              type="custom"
              className="mt-2 text-display font-bold"
            >
              {storageSize}
            </ThemedText>
            <ThemedText className="text-xs" style={{ color: colors.muted }}>
              {t("database.estimatedLocalUsage")}
            </ThemedText>
          </View>
        </View>
      </Card>

      <Card className="mt-5 rounded-[28px] border p-5">
        <ThemedText type="defaultSemiBold">{t("database.history")}</ThemedText>
        <View className="mt-4 gap-3">
          <View className="flex-row px-1">
            <ThemedText
              className="text-xs"
              style={{ color: colors.muted, flex: 1 }}
            >
              {t("database.colDate")}
            </ThemedText>
            <ThemedText
              className="text-xs"
              style={{ color: colors.muted, width: 56 }}
            >
              {t("database.colType")}
            </ThemedText>
            <ThemedText
              className="text-xs"
              style={{ color: colors.muted, width: 64 }}
            >
              {t("database.colRecords")}
            </ThemedText>
            <ThemedText
              className="text-xs text-right"
              style={{
                color: colors.muted,
                width: 54,
              }}
            >
              {t("database.colStatus")}
            </ThemedText>
          </View>
          {history.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>
              {t("database.noExportsYet")}
            </ThemedText>
          ) : (
            history.slice(0, 4).map((entry, index) => (
              <View
                key={entry.id}
                className="flex-row items-center px-1 py-2"
                style={{
                  borderBottomColor: colors.border,
                  borderBottomWidth:
                    index === Math.min(history.length, 4) - 1 ? 0 : 1,
                }}
              >
                <ThemedText className="text-caption" style={{ flex: 1 }}>
                  {shortDateFormatter.format(new Date(entry.created_at))}
                </ThemedText>
                <ThemedText className="text-caption" style={{ width: 56 }}>
                  {entry.file_type}
                </ThemedText>
                <ThemedText className="text-caption" style={{ width: 64 }}>
                  {entry.record_count}
                </ThemedText>
                <View className="w-[54px] items-end">
                  <IconSymbol
                    name="gearshape.fill"
                    size={16}
                    color={
                      entry.status === "success"
                        ? colors.success
                        : colors.danger
                    }
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </Card>

      <Card className="mt-5 rounded-[28px] border p-5">
        <ThemedText type="defaultSemiBold">{t("database.recentExports")}</ThemedText>
        <View className="mt-4 gap-3">
          {recentExports.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>
              {t("database.recentExportsEmpty")}
            </ThemedText>
          ) : (
            recentExports.map((entry) => (
              <View key={entry.id} className="flex-row items-center gap-3">
                <View
                  className="h-9 w-9 items-center justify-center rounded-xl"
                  style={{ backgroundColor: colors.background }}
                >
                  <IconSymbol
                    name="square.and.arrow.up.fill"
                    size={18}
                    color={colors.accent}
                  />
                </View>
                <View className="flex-1">
                  <ThemedText type="defaultSemiBold">
                    {t("database.excelExport")}
                  </ThemedText>
                  <ThemedText className="text-caption" style={{ color: colors.muted }}>
                    {entry.record_count} {t("common.records")}{" "}
                    {t("common.separatorMiddleDot")}{" "}
                    {shortDateTimeFormatter.format(new Date(entry.created_at))}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>

        <Button
          className="mt-6"
          disabled={isExporting || isPurging || recordCount === 0}
          label={
            isExporting ? t("database.exporting") : t("database.exportToExcel")
          }
          onPress={() => void handleExport()}
        />
        <ThemedText className="mt-4 text-xs" style={{ color: colors.muted }}>
          {t("database.purgeHint")}
        </ThemedText>
        <Button
          className="mt-3"
          disabled={isPurging || isExporting || recordCount === 0}
          label={
            isPurging ? t("database.cleaning") : t("database.cleanNonFinal")
          }
          onPress={handlePurgeNonFinalInvoices}
          variant="destructive"
        />
      </Card>
    </ScreenContainer>
  );
}
