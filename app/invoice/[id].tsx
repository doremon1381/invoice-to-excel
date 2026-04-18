import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { FinancialSummary } from '@/components/FinancialSummary';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInvoiceExport } from '@/hooks/useInvoiceExport';
import { deleteInvoice, getInvoiceById } from '@/lib/db';
import type { InvoiceDetail } from '@/lib/types';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { exportSingle, isExporting } = useInvoiceExport();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: invoice?.invoice_number ? `Invoice ${invoice.invoice_number}` : 'Invoice Detail',
    });
  }, [invoice?.invoice_number, navigation]);

  const loadInvoice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextInvoice = await getInvoiceById(invoiceId);
      setInvoice(nextInvoice);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load invoice.');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useFocusEffect(
    useCallback(() => {
      void loadInvoice();
    }, [loadInvoice]),
  );

  const handleExport = useCallback(async () => {
    try {
      await exportSingle(invoiceId);
    } catch (caughtError) {
      Alert.alert('Export failed', caughtError instanceof Error ? caughtError.message : 'Unable to export invoice.');
    }
  }, [exportSingle, invoiceId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => void handleExport()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, paddingHorizontal: 8 })}>
          <ThemedText>{isExporting ? 'Exporting...' : 'Export'}</ThemedText>
        </Pressable>
      ),
    });
  }, [handleExport, isExporting, navigation]);

  async function handleDelete() {
    Alert.alert('Delete invoice', 'Are you sure you want to delete this invoice?', [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteInvoice(invoiceId);
            router.replace('/');
          } catch {
            Alert.alert('Delete failed', 'Unable to delete the invoice.');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <LoadingOverlay message="Loading invoice…" />
      </ThemedView>
    );
  }

  if (error || !invoice) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>{error ?? 'Invoice not found.'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: invoice.image_uri }} style={[styles.image, { borderColor: colors.border }]} />

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText type="title">{invoice.vendor_name ?? 'Unknown vendor'}</ThemedText>
          <ThemedText style={{ color: colors.muted }}>Invoice #{invoice.invoice_number ?? 'N/A'}</ThemedText>
          <ThemedText>Invoice date: {invoice.invoice_date ?? 'Unknown'}</ThemedText>
          <ThemedText>Due date: {invoice.due_date ?? 'Unknown'}</ThemedText>
          <ThemedText>Payment method: {invoice.payment_method ?? 'Unknown'}</ThemedText>
          <ThemedText>Notes: {invoice.notes ?? '—'}</ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ThemedText type="subtitle">Line Items</ThemedText>
          {invoice.line_items.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>No line items extracted.</ThemedText>
          ) : (
            invoice.line_items.map((item, index) => (
              <View key={`${item.description}-${index}`} style={[styles.lineItemRow, { borderBottomColor: colors.border }]}>
                <View style={styles.lineItemText}>
                  <ThemedText type="defaultSemiBold">{item.description}</ThemedText>
                  <ThemedText style={{ color: colors.muted }}>
                    Qty: {item.quantity ?? '—'} · Unit: {item.unit ?? '—'}
                  </ThemedText>
                </View>
                <ThemedText>{item.total_price ?? item.unit_price ?? '—'}</ThemedText>
              </View>
            ))
          )}
        </View>

        <FinancialSummary
          currency={invoice.currency}
          discountAmount={invoice.discount_amount}
          subtotal={invoice.subtotal}
          taxAmount={invoice.tax_amount}
          totalAmount={invoice.total_amount}
        />

        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [styles.deleteButton, { backgroundColor: colors.danger, opacity: pressed ? 0.8 : 1 }]}>
          <ThemedText lightColor="#FFFFFF" darkColor="#FFFFFF">Delete Invoice</ThemedText>
        </Pressable>
      </ScrollView>
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
    gap: 16,
    padding: 20,
  },
  image: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    width: '100%',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  lineItemRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  lineItemText: {
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 50,
  },
});
