import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, View } from "react-native";

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
import { getInvoiceCount } from "@/lib/db";
import { Storage } from "@/lib/storage";
import type { ExportHistoryEntry } from "@/lib/types";

export default function DatabaseManagementScreen() {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { exportAll, isExporting } = useInvoiceExport();
  const [recordCount, setRecordCount] = useState(0);
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          : "Unable to load database metrics.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  async function handleExport() {
    try {
      await exportAll();
      await loadData();
    } catch (caughtError) {
      Alert.alert(
        "Export failed",
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to export invoices.",
      );
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer padded={false}>
        <LoadingState message="Loading database metrics..." />
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
        title="Database management"
        description="Review local storage metrics, export history, and Excel output activity."
      />

      <Card className="mt-5 rounded-[28px] border p-5">
        <View className="flex-row gap-3">
          <View
            className="flex-1 rounded-2xl border px-4 py-4"
            style={{ borderColor: colors.border }}
          >
            <ThemedText
              style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}
            >
              Total Records
            </ThemedText>
            <ThemedText
              type="title"
              style={{ fontSize: 28, lineHeight: 30, marginTop: 8 }}
            >
              {recordCount}
            </ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
              Invoices stored locally
            </ThemedText>
          </View>
          <View
            className="flex-1 rounded-2xl border px-4 py-4"
            style={{ borderColor: colors.border }}
          >
            <ThemedText
              style={{ color: colors.muted, fontSize: 13, fontWeight: "600" }}
            >
              Storage Size
            </ThemedText>
            <ThemedText
              type="title"
              style={{ fontSize: 28, lineHeight: 30, marginTop: 8 }}
            >
              {storageSize}
            </ThemedText>
            <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
              Estimated local usage
            </ThemedText>
          </View>
        </View>
      </Card>

      <Card className="mt-5 rounded-[28px] border p-5">
        <ThemedText type="defaultSemiBold">History</ThemedText>
        <View className="mt-4 gap-3">
          <View className="flex-row px-1">
            <ThemedText style={{ color: colors.muted, flex: 1, fontSize: 12 }}>
              Date
            </ThemedText>
            <ThemedText style={{ color: colors.muted, width: 56, fontSize: 12 }}>
              Type
            </ThemedText>
            <ThemedText style={{ color: colors.muted, width: 64, fontSize: 12 }}>
              Records
            </ThemedText>
            <ThemedText
              style={{
                color: colors.muted,
                width: 54,
                fontSize: 12,
                textAlign: "right",
              }}
            >
              Status
            </ThemedText>
          </View>
          {history.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>No exports yet.</ThemedText>
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
                <ThemedText style={{ flex: 1, fontSize: 13 }}>
                  {entry.created_at.slice(0, 10)}
                </ThemedText>
                <ThemedText style={{ width: 56, fontSize: 13 }}>
                  {entry.file_type}
                </ThemedText>
                <ThemedText style={{ width: 64, fontSize: 13 }}>
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
        <ThemedText type="defaultSemiBold">Recent Exports</ThemedText>
        <View className="mt-4 gap-3">
          {recentExports.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>
              Export activity will appear here after your first Excel export.
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
                  <ThemedText type="defaultSemiBold">Excel Export</ThemedText>
                  <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                    {entry.record_count} records ·{" "}
                    {entry.created_at.slice(0, 16).replace("T", " ")}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>

        <Button
          className="mt-6"
          disabled={isExporting || recordCount === 0}
          label={isExporting ? "EXPORTING" : "EXPORT TO EXCEL"}
          onPress={() => void handleExport()}
        />
      </Card>
    </ScreenContainer>
  );
}
