import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  Alert,
  Image,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FinancialSummary } from '@/components/invoice/FinancialSummary';
import { LoadingOverlay } from '@/components/scan/LoadingOverlay';
import { ThemedText } from '@/components/shared/themed-text';
import { ThemedView } from '@/components/shared/themed-view';
import { Button } from '@/components/shared/ui/Button';
import { Card } from '@/components/shared/ui/Card';
import { FieldInput } from '@/components/shared/ui/FieldInput';
import { IconSymbol } from '@/components/shared/ui/icon-symbol';
import { NumberBadge } from '@/components/shared/ui/NumberBadge';
import { ScreenContainer } from '@/components/shared/ui/ScreenContainer';
import { Colors } from '@/constants/theme';
import { useInvoiceExport } from '@/hooks/invoice/useInvoiceExport';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';
import { deleteInvoice, getInvoiceById, updateInvoice } from '@/lib/db';
import type { ExtractedInvoice, InvoiceDetail, InvoiceStatus, LineItem } from '@/lib/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function getDisplayValue(value: string | null): string {
  return value ?? '—';
}

function getStatusColor(status: InvoiceDetail['status'], colors: (typeof Colors)[keyof typeof Colors]): string {
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

function deriveEditableStatus(fields: {
  invoice_date: string | null;
  invoice_number: string | null;
  total_amount: number | null;
  vendor_name: string | null;
}): InvoiceStatus {
  const score = [
    fields.vendor_name,
    fields.invoice_number,
    fields.invoice_date,
    fields.total_amount !== null && fields.total_amount !== undefined ? String(fields.total_amount) : null,
  ].filter(Boolean).length;

  return score >= 2 ? 'success' : 'pending';
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { exportSingle, isExporting } = useInvoiceExport();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moreDetailsOpen, setMoreDetailsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [vendorName, setVendorName] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [taxAmountStr, setTaxAmountStr] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

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

  useEffect(() => {
    if (!invoice) {
      return;
    }

    setVendorName(invoice.vendor_name ?? '');
    setVendorAddress(invoice.vendor_address ?? '');
    setInvoiceDate(invoice.invoice_date ?? '');
    setTotalAmountStr(
      invoice.total_amount !== null && invoice.total_amount !== undefined ? String(invoice.total_amount) : '',
    );
    setTaxAmountStr(
      invoice.tax_amount !== null && invoice.tax_amount !== undefined ? String(invoice.tax_amount) : '',
    );
  }, [invoice]);

  const handleExport = useCallback(async () => {
    try {
      await exportSingle(invoiceId);
    } catch (caughtError) {
      Alert.alert('Export failed', caughtError instanceof Error ? caughtError.message : 'Unable to export invoice.');
    }
  }, [exportSingle, invoiceId]);

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

  async function handleConfirm() {
    if (!invoice) {
      return;
    }

    const totalNum = Number.parseFloat(totalAmountStr);
    const taxNum = Number.parseFloat(taxAmountStr);

    const extracted: ExtractedInvoice = {
      vendor_name: vendorName.trim() || null,
      vendor_address: vendorAddress.trim() || null,
      invoice_number: invoice.invoice_number,
      invoice_date: invoiceDate.trim() || null,
      due_date: invoice.due_date,
      subtotal: invoice.subtotal,
      tax_amount: Number.isFinite(taxNum) ? taxNum : null,
      discount_amount: invoice.discount_amount,
      total_amount: Number.isFinite(totalNum) ? totalNum : null,
      currency: invoice.currency,
      payment_method: invoice.payment_method,
      notes: invoice.notes,
      line_items: invoice.line_items,
    };

    const status = deriveEditableStatus({
      vendor_name: extracted.vendor_name,
      invoice_number: extracted.invoice_number,
      invoice_date: extracted.invoice_date,
      total_amount: extracted.total_amount,
    });

    setIsSaving(true);

    try {
      await updateInvoice(invoiceId, { extracted, status });
      router.replace('/');
    } catch (caughtError) {
      Alert.alert(
        'Save failed',
        caughtError instanceof Error ? caughtError.message : 'Unable to save changes.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  function bumpTotal(delta: number) {
    const cur = Number.parseFloat(totalAmountStr);
    const base = Number.isFinite(cur) ? cur : 0;
    setTotalAmountStr((base + delta).toFixed(2));
  }

  if (isLoading) {
    return (
      <ScreenContainer padded={false}>
        <LoadingOverlay message="Loading invoice…" />
      </ScreenContainer>
    );
  }

  if (error || !invoice) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ThemedText>{error ?? 'Invoice not found.'}</ThemedText>
        <Button className="mt-3" label="Retry" variant="secondary" onPress={() => void loadInvoice()} />
      </ScreenContainer>
    );
  }

  const statusColor = getStatusColor(invoice.status, colors);

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 20,
          paddingTop: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Go back"
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.back()}
            style={({ pressed }) => ({ backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.85 : 1 })}>
            <IconSymbol name="chevron.left" size={22} color={colors.foreground} />
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Button
              disabled={isExporting}
              label={isExporting ? 'Exporting' : 'Export'}
              size="sm"
              variant="secondary"
              onPress={() => void handleExport()}
            />
            <Image
              source={{ uri: invoice.image_uri }}
              className="h-12 w-12 rounded-xl border"
              style={{ borderColor: colors.border }}
            />
          </View>
        </View>

        <ThemedText className="mt-6" type="defaultSemiBold" style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Structured review
        </ThemedText>
        <ThemedText className="mt-1" style={{ color: colors.muted }}>
          Verify AI-extracted fields before they are used for export.
        </ThemedText>

        <Card className="mt-6 rounded-3xl border p-5" tone="accentSoft">
          <View className="mb-4 flex-row items-center gap-3">
            <NumberBadge value={1} />
            <ThemedText type="defaultSemiBold" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
              Vendor details
            </ThemedText>
          </View>
          <View className="gap-4">
            <FieldInput
              label="Vendor"
              value={vendorName}
              onChangeText={setVendorName}
              trailing={<IconSymbol name="pencil" size={20} color={colors.muted} />}
            />
            <FieldInput
              label="Content"
              value={vendorAddress}
              onChangeText={setVendorAddress}
              placeholder="Address or extra vendor context"
            />
          </View>
        </Card>

        <Card className="mt-5 rounded-3xl border p-5" tone="accentSoft">
          <View className="mb-4 flex-row items-center gap-3">
            <NumberBadge value={2} />
            <ThemedText type="defaultSemiBold" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
              Transaction
            </ThemedText>
          </View>
          <View className="gap-4">
            <View className="flex-row gap-3">
              <View className="min-w-0 flex-1">
                <FieldInput
                  accentBorder
                  label="Date"
                  value={invoiceDate}
                  onChangeText={setInvoiceDate}
                  trailing={<IconSymbol name="calendar" size={20} color={colors.accent} />}
                />
              </View>
              <View className="min-w-0 flex-1">
                <FieldInput
                  accentBorder
                  keyboardType="decimal-pad"
                  label="Total"
                  value={totalAmountStr}
                  onChangeText={setTotalAmountStr}
                  trailing={
                    <View>
                      <Pressable
                        accessibilityLabel="Increase total"
                        className="py-1"
                        onPress={() => bumpTotal(1)}
                        hitSlop={6}>
                        <IconSymbol name="chevron.up" size={20} color={colors.accent} />
                      </Pressable>
                      <Pressable
                        accessibilityLabel="Decrease total"
                        className="py-1"
                        onPress={() => bumpTotal(-1)}
                        hitSlop={6}>
                        <IconSymbol name="chevron.down" size={20} color={colors.accent} />
                      </Pressable>
                    </View>
                  }
                />
              </View>
            </View>
            <FieldInput
              accentBorder
              keyboardType="decimal-pad"
              label="Tax"
              value={taxAmountStr}
              onChangeText={setTaxAmountStr}
              trailing={<IconSymbol name="chevron.down" size={20} color={colors.accent} />}
            />
          </View>
        </Card>

        <Card className="mt-5 rounded-3xl border p-5" tone="accentSoft">
          <View className="mb-4 flex-row items-center gap-3">
            <NumberBadge value={3} />
            <ThemedText type="defaultSemiBold" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
              Summary
            </ThemedText>
          </View>
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <ThemedText style={{ color: colors.muted }}>Currency</ThemedText>
              <ThemedText type="defaultSemiBold">{invoice.currency}</ThemedText>
            </View>
            <View className="flex-row items-center justify-between">
              <ThemedText style={{ color: colors.muted }}>Payment method</ThemedText>
              <ThemedText type="defaultSemiBold">{getDisplayValue(invoice.payment_method)}</ThemedText>
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <ThemedText style={{ color: colors.muted }}>Status</ThemedText>
              <View className="rounded-full px-3 py-1" style={{ backgroundColor: statusColor }}>
                <ThemedText style={{ color: colors.onAccent, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
                  {invoice.status}
                </ThemedText>
              </View>
            </View>
          </View>
        </Card>

        <Pressable
          className="mt-6 flex-row items-center justify-between rounded-2xl border px-4 py-3"
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setMoreDetailsOpen((open) => !open);
          }}
          style={{ borderColor: colors.border, backgroundColor: colors.surfaceAlt }}>
          <ThemedText type="defaultSemiBold">More details</ThemedText>
          <IconSymbol name="chevron.right" size={22} color={colors.foreground} />
        </Pressable>

        {moreDetailsOpen ? (
          <View className="mt-4 gap-6">
            <Card className="rounded-3xl border p-5">
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
            </Card>

            <Card className="rounded-3xl border p-5">
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
                      style={{
                        borderBottomColor: colors.border,
                        borderBottomWidth: index === invoice.line_items.length - 1 ? 0 : 1,
                      }}>
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
            </Card>

            <FinancialSummary
              currency={invoice.currency}
              discountAmount={invoice.discount_amount}
              subtotal={invoice.subtotal}
              taxAmount={invoice.tax_amount}
              totalAmount={invoice.total_amount}
            />

            <Button label="Delete invoice" variant="destructive" onPress={handleDelete} />
          </View>
        ) : null}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t px-5 pt-3"
        style={{
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        }}>
        <View className="min-w-0 flex-1">
          <Button disabled={isSaving} label="Confirm" loading={isSaving} onPress={() => void handleConfirm()} />
        </View>
        <View className="min-w-0 flex-1">
          <Button label="Rescan" variant="secondary" onPress={() => router.replace('/(tabs)/scan')} />
        </View>
      </View>
    </ThemedView>
  );
}
