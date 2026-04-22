import * as Haptics from "expo-haptics";
import { useRef } from "react";
import { Platform, Pressable, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { useTranslation } from "react-i18next";

import {
  INVOICE_SWIPE_ACTION_WIDTH,
  InvoiceSwipeDeleteAction,
} from "@/components/invoice/InvoiceSwipeDeleteAction";
import { ThemedText } from "@/components/shared/themed-text";
import { Button } from "@/components/shared/ui/Button";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import type { InvoiceListItem } from "@/lib/types";

interface InvoiceCardProps {
  invoice: InvoiceListItem;
  onPress: () => void;
  onDelete: () => void;
  /** Shown only when invoice is not in a final status (success / error). */
  onConfirm?: () => void;
  onRescan?: () => void;
  /** Defaults to true. Disable for contexts where swiping should be inert. */
  enableSwipeToDelete?: boolean;
}

function formatAmount(totalAmount: number | null, currency: string): string {
  if (totalAmount === null) {
    return "—";
  }

  return `${totalAmount.toFixed(2)} ${currency}`;
}

export function InvoiceCard({
  invoice,
  onPress,
  onDelete,
  onConfirm,
  onRescan,
  enableSwipeToDelete = true,
}: InvoiceCardProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const swipeableRef = useRef<SwipeableMethods | null>(null);
  const canEdit =
    invoice.status !== "success" && invoice.status !== "error";
  const showActions = canEdit && (onConfirm != null || onRescan != null);
  const badgeColor =
    invoice.status === "success"
      ? colors.success
      : invoice.status === "error"
        ? colors.danger
        : colors.warning;
  const statusLabel =
    invoice.status === "success"
      ? t("invoice.badgeSaved")
      : invoice.status === "error"
        ? t("invoice.badgeFailed")
        : t("invoice.badgePending");

  function triggerDelete() {
    swipeableRef.current?.close();
    onDelete();
  }

  const cardBody = (
    <View
      className="overflow-hidden rounded-[24px] border"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: colorScheme === "dark" ? 0.2 : 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Pressable
        accessibilityHint={
          enableSwipeToDelete ? t("invoice.swipeDeleteHint") : undefined
        }
        accessibilityRole="button"
        className="px-4 py-4"
        delayLongPress={320}
        onLongPress={onDelete}
        onPress={onPress}
        style={({ pressed }) => ({
          opacity: pressed ? 0.94 : 1,
        })}
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-[1.5] gap-0.5">
            <ThemedText type="defaultSemiBold">
              {invoice.vendor_name ?? t("invoice.unknownVendor")}
            </ThemedText>
            <ThemedText type="custom" className="text-caption" style={{ color: colors.muted }}>
              {invoice.invoice_date ?? t("invoice.unknownDate")}
            </ThemedText>
          </View>

          <View className="min-w-[90px]">
            <ThemedText
              type="custom"
              className="text-xs font-semibold"
              style={{ color: colors.muted }}
            >
              {t("common.total")}
            </ThemedText>
            <ThemedText
              type="custom"
              numberOfLines={1}
              className="text-lead font-semibold"
            >
              {formatAmount(invoice.total_amount, invoice.currency)}
            </ThemedText>
          </View>

          <View className="flex-1 items-end gap-1">
            <View
              className="h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: badgeColor }}
            >
              <ThemedText
                type="custom"
                className="text-tiny font-bold"
                style={{
                  color: colors.onAccent,
                }}
              >
                ✓
              </ThemedText>
            </View>
            <ThemedText
              type="custom"
              className="text-xs font-bold capitalize"
              style={{
                color: badgeColor,
              }}
            >
              {statusLabel}
            </ThemedText>
          </View>
        </View>
      </Pressable>

      {showActions ? (
        <View
          className="flex-row gap-2 border-t px-4 py-3"
          style={{ borderTopColor: colors.border }}
        >
          {onConfirm != null ? (
            <View className="min-w-0 flex-1">
              <Button
                label={t("invoice.confirm")}
                size="sm"
                onPress={onConfirm}
              />
            </View>
          ) : null}
          {onRescan != null ? (
            <View className="min-w-0 flex-1">
              <Button
                label={t("invoice.rescan")}
                size="sm"
                variant="secondary"
                onPress={onRescan}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (!enableSwipeToDelete) {
    return <View className="mb-3">{cardBody}</View>;
  }

  return (
    <View className="mb-3 overflow-hidden rounded-[24px]">
      <ReanimatedSwipeable
        ref={swipeableRef}
        containerStyle={{ backgroundColor: colors.danger }}
        friction={1.5}
        rightThreshold={INVOICE_SWIPE_ACTION_WIDTH * 0.6}
        overshootRight={false}
        onSwipeableWillOpen={(direction) => {
          if (direction === "right" && Platform.OS !== "web") {
            void Haptics.selectionAsync().catch(() => {
              // Ignore haptic errors on devices without the capability.
            });
          }
        }}
        onSwipeableOpen={(direction) => {
          if (direction === "right") {
            triggerDelete();
          }
        }}
        renderRightActions={(progress) => (
          <InvoiceSwipeDeleteAction
            progress={progress}
            onPress={triggerDelete}
          />
        )}
      >
        {cardBody}
      </ReanimatedSwipeable>
    </View>
  );
}
