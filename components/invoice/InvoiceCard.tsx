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

export function InvoiceCard({ invoice, onPress, onDelete }: InvoiceCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const badgeColor =
    invoice.status === 'success'
      ? colors.success
      : invoice.status === 'error'
        ? colors.danger
        : colors.warning;

  return (
    <Pressable
      accessibilityRole="button"
      className="mb-3 rounded-3xl border p-5"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderColor: colors.border,
        opacity: pressed ? 0.92 : 1,
      })}>
      <View className="flex-row items-start justify-between gap-3">
        <ThemedText type="defaultSemiBold" style={{ flex: 1 }}>
          {invoice.vendor_name ?? 'Unknown vendor'}
        </ThemedText>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: badgeColor }}>
          <ThemedText style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>
            {invoice.status}
          </ThemedText>
        </View>
      </View>

      <View className="mt-4 gap-1">
        <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
          Invoice #{invoice.invoice_number ?? 'N/A'}
        </ThemedText>
        <ThemedText style={{ color: colors.muted, fontSize: 14 }}>
          Date: {invoice.invoice_date ?? 'Unknown'}
        </ThemedText>
      </View>

      <View className="mt-5 flex-row items-end justify-between gap-4">
        <ThemedText type="subtitle">{formatAmount(invoice.total_amount, invoice.currency)}</ThemedText>

        <Pressable onPress={onDelete} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <ThemedText style={{ color: colors.danger, fontWeight: '600' }}>Delete</ThemedText>
        </Pressable>
      </View>
    </Pressable>
  );
}
