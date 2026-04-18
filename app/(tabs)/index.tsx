import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { InvoiceCard } from '@/components/InvoiceCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInvoiceExport } from '@/hooks/useInvoiceExport';
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
          disabled={invoices.length === 0 || isExporting}
          onPress={handleExportAll}
          style={({ pressed }) => ({
            opacity: invoices.length === 0 ? 0.4 : pressed ? 0.7 : 1,
            paddingHorizontal: 8,
          })}>
          <ThemedText>{isExporting ? 'Exporting...' : 'Export All'}</ThemedText>
        </Pressable>
      ),
    });
  }, [handleExportAll, invoices.length, isExporting, navigation]);

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
          } catch {
            Alert.alert('Delete failed', 'Unable to delete the invoice.');
          }
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      {error ? (
        <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centered}>
          <ThemedText>Loading invoices...</ThemedText>
        </View>
      ) : invoices.length === 0 ? (
        <View style={styles.content}>
          <EmptyState
            title="No invoices yet"
            description="Scan a paper invoice or import one from your gallery to start building your local invoice archive."
          />
          <ThemedText style={[styles.exportHint, { color: colors.muted }]}>Export All stays disabled until at least one invoice exists.</ThemedText>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
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
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    padding: 20,
  },
  listContent: {
    padding: 20,
  },
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
  },
  exportHint: {
    marginTop: 12,
    textAlign: 'center',
  },
});
