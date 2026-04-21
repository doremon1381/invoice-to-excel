import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, View } from "react-native";

import { InvoiceCard } from "@/components/invoice/InvoiceCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ThemedText } from "@/components/shared/themed-text";
import { ThemedView } from "@/components/shared/themed-view";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useInvoiceExport } from "@/hooks/invoice/useInvoiceExport";
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
  { label: "Export Ready", value: "exported" },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { exportAll, isExporting } = useInvoiceExport();
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
  const totalAmount = useMemo(
    () =>
      readyInvoices.reduce(
        (sum, invoice) => sum + (invoice.total_amount ?? 0),
        0,
      ),
    [readyInvoices],
  );

  const handleExportAll = useCallback(async () => {
    if (invoices.length === 0) {
      Alert.alert("No invoices", "Add invoices before exporting.");
      return;
    }

    try {
      await exportAll();
    } catch (caughtError) {
      Alert.alert(
        "Export failed",
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to export invoices.",
      );
    }
  }, [exportAll, invoices.length]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          className="rounded-full border px-4 py-2"
          disabled={invoices.length === 0 || isExporting}
          onPress={handleExportAll}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            opacity: invoices.length === 0 ? 0.4 : pressed ? 0.7 : 1,
          })}
        >
          <ThemedText style={{ fontWeight: "600" }}>
            {isExporting ? "Exporting..." : "Export All"}
          </ThemedText>
        </Pressable>
      ),
    });
  }, [
    colors.border,
    colors.card,
    handleExportAll,
    invoices.length,
    isExporting,
    navigation,
  ]);

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
    <ThemedView
      className="flex-1"
      style={{ backgroundColor: colors.background }}
    >
      <View className="flex-1 px-5 pb-28 pt-4">
        <View className="mb-5 gap-4">
          <View className="gap-1">
            <ThemedText type="title">Invoice Dashboard</ThemedText>
            <ThemedText style={{ color: colors.muted }}>
              Track extracted invoices, scan new receipts, and export your
              records with one tap.
            </ThemedText>
          </View>

          <View className="flex-row gap-3">
            <View
              className="flex-1 rounded-[28px] border p-4"
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
            >
              <View
                className="mb-4 h-32 justify-center rounded-[22px] px-4"
                style={{ backgroundColor: colors.background }}
              >
                <View className="flex-row items-center justify-between">
                  <View
                    className="h-20 w-20 items-center justify-center rounded-full border-[10px]"
                    style={{ borderColor: colors.tint }}
                  >
                    <ThemedText type="subtitle">{invoices.length}</ThemedText>
                  </View>
                  <View className="flex-1 pl-4">
                    <ThemedText
                      style={{
                        color: colors.muted,
                        fontSize: 12,
                        fontWeight: "700",
                      }}
                    >
                      INVOICE ARCHIVE
                    </ThemedText>
                    <ThemedText type="defaultSemiBold" style={{ marginTop: 6 }}>
                      {readyInvoices.length} export-ready
                    </ThemedText>
                    <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                      {Math.max(invoices.length - readyInvoices.length, 0)}{" "}
                      pending review
                    </ThemedText>
                  </View>
                </View>
              </View>
              <ThemedText type="defaultSemiBold">Expense</ThemedText>
              <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
                {readyInvoices.length} ready to export
              </ThemedText>
            </View>

            <Pressable
              accessibilityRole="button"
              className="flex-1 rounded-[28px] px-4 py-5"
              onPress={() => router.push("/scan")}
              style={({ pressed }) => ({
                backgroundColor: colors.tint,
                justifyContent: "space-between",
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <View
                className="h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: colors.background }}
              >
                <IconSymbol name="camera.fill" size={24} color={colors.tint} />
              </View>
              <View className="gap-2">
                <ThemedText
                  style={{
                    color: colors.background,
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  SCAN NEW
                </ThemedText>
                <ThemedText
                  style={{ color: colors.background, fontWeight: "700" }}
                >
                  INVOICE
                </ThemedText>
                <ThemedText
                  style={{
                    color: colors.background,
                    fontSize: 12,
                    opacity: 0.9,
                  }}
                >
                  AI reads the image and fills invoice fields.
                </ThemedText>
              </View>
            </Pressable>
          </View>

          <View
            className="rounded-[24px] border p-4"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <View className="flex-row items-center justify-between gap-4">
              <View>
                <ThemedText
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Ready to export
                </ThemedText>
                <ThemedText type="subtitle">
                  {readyInvoices.length} invoices
                </ThemedText>
              </View>
              <View className="items-end">
                <ThemedText
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    fontWeight: "600",
                  }}
                >
                  Tracked total
                </ThemedText>
                <ThemedText type="defaultSemiBold">
                  ${totalAmount.toFixed(2)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {error ? (
          <View
            className="mb-4 rounded-[24px] border px-4 py-3"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
          </View>
        ) : null}

        <View
          className="mb-4 flex-row rounded-full border p-1"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          {FILTER_OPTIONS.map((option) => {
            const isActive = filter === option.value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                className="flex-1 rounded-full px-4 py-2"
                onPress={() => setFilter(option.value)}
                style={{
                  backgroundColor: isActive ? colors.background : "transparent",
                }}
              >
                <ThemedText
                  style={{
                    color: isActive ? colors.text : colors.muted,
                    fontSize: 13,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center px-5">
            <ThemedText>Loading invoices...</ThemedText>
          </View>
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
              Export All stays disabled until at least one invoice exists.
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
    </ThemedView>
  );
}
