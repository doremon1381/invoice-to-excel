import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/shared/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import { formatCurrency } from "@/lib/formatMoney";

interface FinancialSummaryProps {
  subtotal: number | null;
  taxAmount: number | null;
  discountAmount: number | null;
  totalAmount: number | null;
  currency: string;
}

// function formatCurrency(value: number | null, currency: string): string {
//   if (value === null) {
//     return "—";
//   }

//   return new Intl.NumberFormat("vi-VN", {
//     style: "currency",
//     currency: currency,
//   }).format(value);
// }

export function FinancialSummary({
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
  currency,
}: FinancialSummaryProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  return (
    <View
      className="rounded-3xl border p-5"
      style={{ borderColor: colors.border, backgroundColor: colors.surface }}
    >
      <View className="gap-3">
        <SummaryRow
          label={t("financial.subtotal")}
          value={formatCurrency(subtotal, currency)}
        />
        <SummaryRow
          label={t("financial.tax")}
          value={formatCurrency(taxAmount, currency)}
        />
        <SummaryRow
          label={t("financial.discount")}
          value={formatCurrency(discountAmount, currency)}
        />
        <View className="h-px" style={{ backgroundColor: colors.border }} />
        <SummaryRow
          label={t("financial.total")}
          value={formatCurrency(totalAmount, currency)}
          emphasized
        />
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
    <View className="flex-row items-start justify-between gap-4">
      <ThemedText
        className="min-w-0 flex-1"
        type={emphasized ? "defaultSemiBold" : "default"}
      >
        {label}
      </ThemedText>
      <ThemedText
        className="min-w-0 flex-1 text-right"
        type={emphasized ? "defaultSemiBold" : "default"}
      >
        {value}
      </ThemedText>
    </View>
  );
}
