import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';
import type { InvoiceListItem } from '@/lib/types';

interface InvoiceCardProps {
  invoice: InvoiceListItem;
  onPress: () => void;
  onDelete: () => void;
}

function formatAmount(totalAmount: number | null, currency: string): string {
  if (totalAmount === null) {
    return '—';
  }

  return `${totalAmount.toFixed(2)} ${currency}`;
}

function getStatusLabel(status: InvoiceListItem['status']): string {
  if (status === 'success') {
    return 'available';
  }

  if (status === 'error') {
    return 'failed';
  }

  return 'pending';
}

export function InvoiceCard({ invoice, onPress, onDelete }: InvoiceCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const badgeColor =
    invoice.status === 'success'
      ? colors.success
      : invoice.status === 'error'
        ? colors.danger
        : colors.warning;
  const statusLabel = getStatusLabel(invoice.status);

  return (
    <Pressable
      accessibilityRole="button"
      className="mb-3 rounded-[28px] border px-4 py-4"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderColor: colors.border,
        opacity: pressed ? 0.94 : 1,
      })}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            {invoice.vendor_name ?? 'Unknown vendor'}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
            {invoice.invoice_date ?? 'Unknown date'}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
            Invoice #{invoice.invoice_number ?? 'N/A'}
          </ThemedText>
        </View>

        <View className="items-end gap-2">
          <View
            className="h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: badgeColor }}>
            <ThemedText style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>✓</ThemedText>
          </View>
          <ThemedText
            style={{
              color: badgeColor,
              fontSize: 12,
              fontWeight: '700',
              textTransform: 'capitalize',
            }}>
            {statusLabel}
          </ThemedText>
        </View>
      </View>

      <View className="mt-4 flex-row items-end justify-between gap-4 border-t pt-3" style={{ borderTopColor: colors.border }}>
        <View className="gap-1">
          <ThemedText style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>Total</ThemedText>
          <ThemedText type="subtitle" style={{ fontSize: 20 }}>
            {formatAmount(invoice.total_amount, invoice.currency)}
          </ThemedText>
        </View>

        <Pressable onPress={onDelete} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <ThemedText style={{ color: colors.danger, fontWeight: '600' }}>Delete</ThemedText>
        </Pressable>
      </View>
    </Pressable>
  );
}
