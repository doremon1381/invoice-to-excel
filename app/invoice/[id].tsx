import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';

import { FinancialSummary } from '@/components/invoice/FinancialSummary';
import { LoadingOverlay } from '@/components/scan/LoadingOverlay';
import { ThemedText } from '@/components/shared/themed-text';
import { ThemedView } from '@/components/shared/themed-view';
import { Colors } from '@/constants/theme';
import { useInvoiceExport } from '@/hooks/invoice/useInvoiceExport';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';
import { deleteInvoice, getInvoiceById } from '@/lib/db';
import type { InvoiceDetail, LineItem } from '@/lib/types';

function getDisplayValue(value: string | null): string {
  return value ?? '—';
}

function getStatusColor(status: InvoiceDetail['status'], colors: (typeof Colors)['light']): string {
  if (status === 'success') {
    return colors.success;
  }

  if (status === 'error') {
    return colors.danger;
  }

  return colors.warning;
}

function getLineItemAmount(item: LineItem): string {
  if (item.total_price !== null) {
    return String(item.total_price);
  }

  if (item.unit_price !== null) {
    return String(item.unit_price);
  }

  return '—';
}

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
        <Pressable
          accessibilityRole="button"
          className="rounded-full border px-4 py-2"
          onPress={() => void handleExport()}
          style={({ pressed }) => ({
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            opacity: pressed ? 0.7 : 1,
          })}>
          <ThemedText style={{ fontWeight: '600' }}>{isExporting ? 'Exporting...' : 'Export'}</ThemedText>
        </Pressable>
      ),
    });
  }, [colors.border, colors.card, handleExport, isExporting, navigation]);

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
      <ThemedView className="flex-1" style={{ backgroundColor: colors.background }}>
        <LoadingOverlay message="Loading invoice…" />
      </ThemedView>
    );
  }

  if (error || !invoice) {
    return (
      <ThemedView className="flex-1 items-center justify-center px-5" style={{ backgroundColor: colors.background }}>
        <ThemedText>{error ?? 'Invoice not found.'}</ThemedText>
        <Pressable
          className="mt-3 rounded-2xl border px-4 py-3"
          onPress={() => void loadInvoice()}
          style={({ pressed }) => ({ borderColor: colors.border, opacity: pressed ? 0.8 : 1 })}>
          <ThemedText>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const statusColor = getStatusColor(invoice.status, colors);

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4">
        <Image source={{ uri: invoice.image_uri }} className="aspect-square w-full rounded-3xl" style={{ borderColor: colors.border }} />

        <View className="mt-6 rounded-3xl border p-5" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <View className="flex-row items-start justify-between gap-3">
            <ThemedText type="title" style={{ flex: 1 }}>{invoice.vendor_name ?? 'Unknown vendor'}</ThemedText>
            <View className="rounded-full px-3 py-1" style={{ backgroundColor: statusColor }}>
              <ThemedText style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
                {invoice.status}
              </ThemedText>
            </View>
          </View>
          <View className="mt-3 gap-2">
            <ThemedText style={{ color: colors.muted }}>Invoice #{invoice.invoice_number ?? 'N/A'}</ThemedText>
            <ThemedText>Invoice date: {getDisplayValue(invoice.invoice_date)}</ThemedText>
            <ThemedText>Due date: {getDisplayValue(invoice.due_date)}</ThemedText>
            <ThemedText>Payment method: {getDisplayValue(invoice.payment_method)}</ThemedText>
            <ThemedText>Notes: {getDisplayValue(invoice.notes)}</ThemedText>
          </View>
        </View>

        <View className="mt-6 rounded-3xl border p-5" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <ThemedText type="subtitle">Extraction details</ThemedText>
          <ThemedText className="mt-2" style={{ color: colors.muted }}>
            {invoice.status === 'success'
              ? 'Structured fields came from the AI response. Review the raw model output below if you need to audit the result.'
              : 'Raw model output was stored, but structured extraction is still limited for this invoice.'}
          </ThemedText>
          <View className="mt-4 rounded-2xl border p-4" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
            <ThemedText type="defaultSemiBold">Raw extraction text</ThemedText>
            <ThemedText className="mt-2" style={{ color: colors.muted, fontSize: 13 }}>
              {invoice.raw_text?.trim() ? invoice.raw_text : 'No extraction text was stored for this invoice.'}
            </ThemedText>
          </View>
        </View>

        <View className="mt-6 rounded-3xl border p-5" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <ThemedText type="subtitle">Line Items</ThemedText>
          {invoice.line_items.length === 0 ? (
            <ThemedText className="mt-3" style={{ color: colors.muted }}>
              No line items extracted.
            </ThemedText>
          ) : (
            <View className="mt-4">
              {invoice.line_items.map((item, index) => (
                <View
                  key={`${item.description}-${index}`}
                  className="flex-row justify-between gap-3 py-3"
                  style={{ borderBottomColor: colors.border, borderBottomWidth: index === invoice.line_items.length - 1 ? 0 : 1 }}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="defaultSemiBold">{item.description}</ThemedText>
                    <ThemedText style={{ color: colors.muted }}>
                      Qty: {item.quantity ?? '—'} · Unit: {getDisplayValue(item.unit)}
                    </ThemedText>
                  </View>
                  <ThemedText>{getLineItemAmount(item)}</ThemedText>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="mt-6">
          <FinancialSummary
            currency={invoice.currency}
            discountAmount={invoice.discount_amount}
            subtotal={invoice.subtotal}
            taxAmount={invoice.tax_amount}
            totalAmount={invoice.total_amount}
          />
        </View>

        <Pressable
          className="mt-6 min-h-12 items-center justify-center rounded-2xl"
          onPress={handleDelete}
          style={({ pressed }) => ({ backgroundColor: colors.danger, opacity: pressed ? 0.8 : 1 })}>
          <ThemedText style={{ color: '#FFFFFF', fontWeight: '700' }}>Delete Invoice</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}
