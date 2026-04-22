import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Pressable, View } from "react-native";

import { ExpenseOverview } from "@/components/home/ExpenseOverview";
import { InvoiceFilterBar } from "@/components/home/InvoiceFilterBar";
import { ScanCallToAction } from "@/components/home/ScanCallToAction";
import { InvoiceCard } from "@/components/invoice/InvoiceCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ThemedText } from "@/components/shared/themed-text";
import { ErrorState } from "@/components/shared/ui/ErrorState";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { LoadingState } from "@/components/shared/ui/LoadingState";
import { ScreenContainer } from "@/components/shared/ui/ScreenContainer";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import {
  deleteInvoice,
  getAllInvoicesWithData,
  initializeDatabase,
} from "@/lib/db";
import { computeMonthlyExpense } from "@/lib/monthlyExpense";
import type { InvoiceListItem } from "@/lib/types";

type FilterValue = "all" | "exported";

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");
  const hasLoadedOnceRef = useRef(false);

  const filterOptions = useMemo(
    () => [
      { label: t("home.filterAll"), value: "all" as const },
      { label: t("home.filterExported"), value: "exported" as const },
    ],
    [t],
  );

  const loadInvoices = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;

    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }

    setError(null);

    try {
      await initializeDatabase();
      const nextInvoices = await getAllInvoicesWithData();
      setInvoices(nextInvoices);
      hasLoadedOnceRef.current = true;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("home.loadError"),
      );
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setIsInitialLoading(false);
      }
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void loadInvoices({ silent: hasLoadedOnceRef.current });
    }, [loadInvoices]),
  );

  const readyInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "success"),
    [invoices],
  );
  const filteredInvoices = useMemo(() => {
    if (filter === "exported") {
      return readyInvoices;
    }

    return invoices;
  }, [filter, invoices, readyInvoices]);

  const monthlyExpense = useMemo(
    () => computeMonthlyExpense(invoices),
    [invoices],
  );

  function handleDelete(invoiceId: number) {
    Alert.alert(t("alerts.homeDeleteTitle"), t("alerts.homeDeleteMessage"), [
      { style: "cancel", text: t("common.cancel") },
      {
        style: "destructive",
        text: t("common.delete"),
        onPress: async () => {
          try {
            await deleteInvoice(invoiceId);
            await loadInvoices({ silent: true });
          } catch (caughtError) {
            Alert.alert(
              t("alerts.homeDeleteFailed"),
              caughtError instanceof Error
                ? caughtError.message
                : t("alerts.homeDeleteFailedMessage"),
            );
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer className="pb-28">
      <View className="flex-1">
        <View className="mb-4 flex-row items-center justify-between">
          <View />
          <Pressable
            accessibilityLabel={t("home.openSettingsA11y")}
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.push("/(tabs)/settings")}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <IconSymbol
              name="gearshape.fill"
              size={18}
              color={colors.foreground}
            />
          </Pressable>
        </View>

        <View className="mb-4 flex flex-row gap-4">
          <ExpenseOverview
            currency={monthlyExpense.currency}
            monthDate={monthlyExpense.monthDate}
            totalAmount={monthlyExpense.totalAmount}
          />
          <ScanCallToAction onPress={() => router.push("/scan")} />
        </View>

        {error ? (
          <View className="mb-4">
            <ErrorState
              message={error}
              onRetry={() => void loadInvoices({ silent: false })}
            />
          </View>
        ) : null}

        <InvoiceFilterBar
          activeValue={filter}
          onChange={(value) => setFilter(value as FilterValue)}
          options={filterOptions}
        />

        {isInitialLoading && invoices.length === 0 ? (
          <LoadingState message={t("home.loadingInvoices")} />
        ) : filteredInvoices.length === 0 ? (
          <View className="flex-1">
            <EmptyState
              title={
                filter === "all"
                  ? t("empty.noInvoicesTitle")
                  : t("empty.noExportReadyTitle")
              }
              description={
                filter === "all"
                  ? t("empty.noInvoicesDescription")
                  : t("empty.noExportReadyDescription")
              }
            />
            <ThemedText
              className="mt-3 text-center"
              style={{ color: colors.muted }}
            >
              {t("home.exportHint")}
            </ThemedText>
          </View>
        ) : (
          <FlatList
            className="flex-1"
            contentContainerClassName="pb-6"
            data={filteredInvoices}
            keyExtractor={(item) => String(item.id)}
            onRefresh={() => void loadInvoices({ silent: true })}
            refreshing={isRefreshing}
            renderItem={({ item }) => (
              <InvoiceCard
                invoice={item}
                onConfirm={() => router.push(`/invoice/${item.id}`)}
                onDelete={() => handleDelete(item.id)}
                onPress={() => router.push(`/invoice/${item.id}`)}
                onRescan={() => router.replace("/(tabs)/scan")}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
