import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, View, useWindowDimensions } from "react-native";

import { DashboardOverview } from "@/components/home/DashboardOverview";
import { InvoiceFilterBar } from "@/components/home/InvoiceFilterBar";
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
import type { InvoiceListItem } from "@/lib/types";

type FilterValue = "all" | "exported";

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: "All Invoices", value: "all" },
  { label: "Exported", value: "exported" },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompactHero = width < 360;
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await initializeDatabase();
      const nextInvoices = await getAllInvoicesWithData();
      setInvoices(nextInvoices);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load invoices.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadInvoices();
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
  function handleDelete(invoiceId: number) {
    Alert.alert(
      "Delete invoice",
      "Are you sure you want to delete this invoice?",
      [
        { style: "cancel", text: "Cancel" },
        {
          style: "destructive",
          text: "Delete",
          onPress: async () => {
            try {
              await deleteInvoice(invoiceId);
              await loadInvoices();
            } catch (caughtError) {
              Alert.alert(
                "Delete failed",
                caughtError instanceof Error
                  ? caughtError.message
                  : "Unable to delete the invoice.",
              );
            }
          },
        },
      ],
    );
  }

  return (
    <ScreenContainer className="pb-28">
      <View className="flex-1">
        <View className="mb-4 flex-row items-center justify-between">
          <View />
          <Pressable
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.push("/settings")}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <IconSymbol name="gearshape.fill" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <View className="mb-4">
          <DashboardOverview
            isCompact={isCompactHero}
            onScanPress={() => router.push("/scan")}
          />
        </View>

        {error ? (
          <View className="mb-4">
            <ErrorState message={error} onRetry={() => void loadInvoices()} />
          </View>
        ) : null}

        <InvoiceFilterBar
          activeValue={filter}
          onChange={(value) => setFilter(value as FilterValue)}
          options={FILTER_OPTIONS}
        />

        {isLoading ? (
          <LoadingState message="Loading invoices..." />
        ) : filteredInvoices.length === 0 ? (
          <View className="flex-1">
            <EmptyState
              title={
                filter === "all"
                  ? "No invoices yet"
                  : "No export-ready invoices"
              }
              description={
                filter === "all"
                  ? "Scan a paper invoice or import one from your gallery to start building your local invoice archive."
                  : "Successful invoice scans will appear here when they are ready to export."
              }
            />
            <ThemedText
              className="mt-3 text-center"
              style={{ color: colors.muted }}
            >
              Export options are available in the Database Management screen.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            className="flex-1"
            contentContainerClassName="pb-6"
            data={filteredInvoices}
            keyExtractor={(item) => String(item.id)}
            onRefresh={() => void loadInvoices()}
            refreshing={isLoading}
            renderItem={({ item }) => (
              <InvoiceCard
                invoice={item}
                onDelete={() => handleDelete(item.id)}
                onPress={() => router.push(`/invoice/${item.id}`)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}
