import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}>
      <View style={styles.headerRow}>
        <ThemedText type="defaultSemiBold" style={styles.vendorName}>
          {invoice.vendor_name ?? 'Unknown vendor'}
        </ThemedText>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <ThemedText style={styles.badgeText} lightColor="#FFFFFF" darkColor="#FFFFFF">
            {invoice.status}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.metaText, { color: colors.muted }]}>
        Invoice #{invoice.invoice_number ?? 'N/A'}
      </ThemedText>
      <ThemedText style={[styles.metaText, { color: colors.muted }]}>
        Date: {invoice.invoice_date ?? 'Unknown'}
      </ThemedText>
      <ThemedText type="subtitle" style={styles.amountText}>
        {formatAmount(invoice.total_amount, invoice.currency)}
      </ThemedText>

      <Pressable onPress={onDelete} style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.75 : 1 }] }>
        <ThemedText style={{ color: colors.danger }}>Delete</ThemedText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
    padding: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vendorName: {
    flex: 1,
    marginRight: 12,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metaText: {
    fontSize: 14,
  },
  amountText: {
    marginTop: 4,
  },
  deleteButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
  },
});
