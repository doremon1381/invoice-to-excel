import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface FinancialSummaryProps {
  subtotal: number | null;
  taxAmount: number | null;
  discountAmount: number | null;
  totalAmount: number | null;
  currency: string;
}

function formatCurrency(value: number | null, currency: string): string {
  if (value === null) {
    return '—';
  }

  return `${value.toFixed(2)} ${currency}`;
}

export function FinancialSummary({
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
  currency,
}: FinancialSummaryProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <SummaryRow label="Subtotal" value={formatCurrency(subtotal, currency)} />
      <SummaryRow label="Tax" value={formatCurrency(taxAmount, currency)} />
      <SummaryRow label="Discount" value={formatCurrency(discountAmount, currency)} />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <SummaryRow label="Total" value={formatCurrency(totalAmount, currency)} emphasized />
    </View>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <View style={styles.row}>
      <ThemedText type={emphasized ? 'defaultSemiBold' : 'default'}>{label}</ThemedText>
      <ThemedText type={emphasized ? 'defaultSemiBold' : 'default'}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
  },
});
