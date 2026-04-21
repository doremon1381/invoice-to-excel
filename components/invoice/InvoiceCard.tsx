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
      className="mb-3 rounded-[24px] border px-4 py-4"
      onLongPress={onDelete}
      delayLongPress={320}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderColor: colors.border,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: colorScheme === "dark" ? 0.2 : 0.06,
        shadowRadius: 8,
        elevation: 2,
        opacity: pressed ? 0.94 : 1,
      })}>
      <View className="flex-row items-center gap-3">
        <View className="flex-[1.5] gap-0.5">
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            {invoice.vendor_name ?? 'Unknown vendor'}
          </ThemedText>
          <ThemedText style={{ color: colors.muted, fontSize: 13 }}>
            {invoice.invoice_date ?? 'Unknown date'}
          </ThemedText>
        </View>

        <View className="min-w-[90px]">
          <ThemedText style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>
            Total
          </ThemedText>
          <ThemedText
            type="defaultSemiBold"
            numberOfLines={1}
            style={{ fontSize: 17 }}
          >
            {formatAmount(invoice.total_amount, invoice.currency)}
          </ThemedText>
        </View>

        <View className="flex-1 items-end gap-1">
          <View
            className="h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: badgeColor }}>
            <ThemedText style={{ color: colors.onAccent, fontSize: 11, fontWeight: '700' }}>✓</ThemedText>
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
    </Pressable>
  );
}
