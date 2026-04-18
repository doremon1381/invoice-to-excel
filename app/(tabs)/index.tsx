import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';

import { InvoiceCard } from '@/components/invoice/InvoiceCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ThemedText } from '@/components/shared/themed-text';
import { ThemedView } from '@/components/shared/themed-view';
import { Colors } from '@/constants/theme';
import { useInvoiceExport } from '@/hooks/invoice/useInvoiceExport';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';
import { deleteInvoice, getAllInvoicesWithData, initializeDatabase } from '@/lib/db';
import type { InvoiceListItem } from '@/lib/types';

export default function HomeScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { exportAll, isExporting } = useInvoiceExport();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await initializeDatabase();
      const nextInvoices = await getAllInvoicesWithData();
      setInvoices(nextInvoices);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load invoices.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadInvoices();
    }, [loadInvoices]),
  );

  const handleExportAll = useCallback(async () => {
    if (invoices.length === 0) {
      Alert.alert('No invoices', 'Add invoices before exporting.');
      return;
    }

    try {
      await exportAll();
    } catch (caughtError) {
      Alert.alert('Export failed', caughtError instanceof Error ? caughtError.message : 'Unable to export invoices.');
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
          })}>
          <ThemedText style={{ fontWeight: '600' }}>{isExporting ? 'Exporting...' : 'Export All'}</ThemedText>
        </Pressable>
      ),
    });
  }, [colors.border, colors.card, handleExportAll, invoices.length, isExporting, navigation]);

  function handleDelete(invoiceId: number) {
    Alert.alert('Delete invoice', 'Are you sure you want to delete this invoice?', [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteInvoice(invoiceId);
            await loadInvoices();
          } catch (caughtError) {
            Alert.alert(
              'Delete failed',
              caughtError instanceof Error ? caughtError.message : 'Unable to delete the invoice.',
            );
          }
        },
      },
    ]);
  }

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 px-5 pb-5 pt-4">
        <View className="mb-5 gap-2">
          <ThemedText type="title">Invoice archive</ThemedText>
          <ThemedText style={{ color: colors.muted }}>
            Review extracted invoices, manage your local history, and export your records to Excel.
          </ThemedText>
        </View>

        {error ? (
          <View
            className="mb-4 rounded-2xl border px-4 py-3"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
          </View>
        ) : null}

        {isLoading ? (
          <View className="flex-1 items-center justify-center px-5">
            <ThemedText>Loading invoices...</ThemedText>
          </View>
        ) : invoices.length === 0 ? (
          <View className="flex-1">
            <EmptyState
              title="No invoices yet"
              description="Scan a paper invoice or import one from your gallery to start building your local invoice archive."
            />
            <ThemedText className="mt-3 text-center" style={{ color: colors.muted }}>
              Export All stays disabled until at least one invoice exists.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            className="flex-1"
            contentContainerClassName="pb-6"
            data={invoices}
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
