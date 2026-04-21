import { View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

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
    <View className="rounded-3xl border p-5" style={{ borderColor: colors.border, backgroundColor: colors.surface }}>
      <View className="gap-3">
        <SummaryRow label="Subtotal" value={formatCurrency(subtotal, currency)} />
        <SummaryRow label="Tax" value={formatCurrency(taxAmount, currency)} />
        <SummaryRow label="Discount" value={formatCurrency(discountAmount, currency)} />
        <View className="h-px" style={{ backgroundColor: colors.border }} />
        <SummaryRow label="Total" value={formatCurrency(totalAmount, currency)} emphasized />
      </View>
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
    <View className="flex-row justify-between gap-4">
      <ThemedText type={emphasized ? 'defaultSemiBold' : 'default'}>{label}</ThemedText>
      <ThemedText type={emphasized ? 'defaultSemiBold' : 'default'}>{value}</ThemedText>
    </View>
  );
}
