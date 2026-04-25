import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { ThemedText } from "@/components/shared/themed-text";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { Typography } from "@/constants/typography";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import { formatMoney } from "@/lib/formatMoney";
import { getIntlLocale } from "@/lib/i18n";

type ExpenseOverviewProps = {
  totalAmount: number;
  currency: string;
  monthDate: Date;
};

export function ExpenseOverview({
  totalAmount,
  currency,
  monthDate,
}: ExpenseOverviewProps) {
  const { t, i18n } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const locale = getIntlLocale(i18n.resolvedLanguage ?? i18n.language);
  const { value: formattedValue, currency: currencyCode } = formatMoney(
    totalAmount,
    currency,
    locale,
  );

  const monthLabel = monthDate.toLocaleString(locale, {
    month: "long",
    year: "numeric",
  });

  const accessibilityLabel = t("home.monthExpenseA11y", {
    month: monthLabel,
    amount: formattedValue,
    currency: currencyCode,
  });

  const isEmptyMonth = totalAmount === 0;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="summary"
      accessible
      className="min-h-[142px] flex-1 rounded-[24px] border border-transparent px-4 py-4"
      style={{ backgroundColor: colors.accent }}
    >
      <View className="mb-2 flex-row items-start justify-between">
        <ThemedText type="overline" scaleRole="chrome" style={{ color: colors.onAccentMuted }}>
          {t("home.thisMonth")}
        </ThemedText>
        <View
          className="h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: colors.surface }}
        >
          <IconSymbol name="calendar" size={22} color={colors.accent} />
        </View>
      </View>

        <ThemedText
          type="custom"
          className="text-md font-semibold"
          scaleRole="chrome"
          style={{
            color: colors.onAccentMuted,
            fontSize: Typography.md.size,
          lineHeight: Typography.md.lineHeight,
        }}
      >
        {monthLabel}
      </ThemedText>

      <View className="mt-3 flex-row flex-wrap items-baseline gap-x-2">
        <ThemedText
          type="custom"
          className="text-display-lg font-bold"
          scaleRole="heading"
          style={{
            color: colors.onAccent,
            fontSize: Typography.displayLg.size,
            lineHeight: Typography.displayLg.lineHeight,
          }}
        >
          {formattedValue}
        </ThemedText>
        <ThemedText
          type="custom"
          className="text-lead font-semibold"
          scaleRole="heading"
          style={{
            color: colors.onAccent,
            fontSize: Typography.lead.size,
            lineHeight: Typography.lead.lineHeight,
          }}
        >
          {currencyCode}
        </ThemedText>
      </View>

      {isEmptyMonth ? (
        <ThemedText
          type="custom"
          className="text-caption mt-2"
          scaleRole="chrome"
          style={{ color: colors.onAccentMuted }}
        >
          {t("home.monthExpenseEmpty")}
        </ThemedText>
      ) : null}
    </View>
  );
}
