import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/shared/themed-text";
import { Button } from "@/components/shared/ui/Button";
import { Card } from "@/components/shared/ui/Card";
import { FieldInput } from "@/components/shared/ui/FieldInput";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import type { SheetRowPayload } from "@/lib/googleSheets";

type PushToSheetModalProps = {
  initialRow: SheetRowPayload;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (row: SheetRowPayload) => Promise<void>;
  visible: boolean;
};

export function PushToSheetModal({
  initialRow,
  isSubmitting,
  onClose,
  onSubmit,
  visible,
}: PushToSheetModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");

  useEffect(() => {
    if (!visible) {
      return;
    }

    setDate(initialRow.date ?? "");
    setName(initialRow.name ?? "");
    setAmount(
      typeof initialRow.amount === "number" ? String(initialRow.amount) : "",
    );
    setPayer(initialRow.payer ?? "");
  }, [initialRow.amount, initialRow.date, initialRow.name, initialRow.payer, visible]);

  const canSubmit = useMemo(() => {
    return (
      date.trim().length > 0 &&
      name.trim().length > 0 &&
      payer.trim().length > 0 &&
      amount.trim().length > 0
    );
  }, [amount, date, name, payer]);

  async function handleSubmit() {
    const parsedAmount = Number.parseFloat(amount);
    if (!Number.isFinite(parsedAmount)) {
      return;
    }

    await onSubmit({
      amount: parsedAmount,
      date: date.trim(),
      name: name.trim(),
      payer: payer.trim(),
    });
  }

  return (
    <Modal
      animationType="slide"
      visible={visible}
      transparent
      onRequestClose={onClose}
    >
      <View
        className="flex-1 justify-end"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Pressable className="flex-1" onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={20}
        >
          <Card className="rounded-t-3xl border px-5 pb-6 pt-5">
            <ThemedText type="subtitle">
              {t("invoice.pushSheetModalTitle")}
            </ThemedText>
            <ThemedText className="mt-2" style={{ color: colors.muted }}>
              {t("invoice.pushSheetModalHint")}
            </ThemedText>

            <View className="mt-4 gap-3">
              <FieldInput
                accentBorder
                label={t("invoice.labelDate")}
                value={date}
                onChangeText={setDate}
              />
              <FieldInput
                accentBorder
                label={t("invoice.pushSheetInvoiceName")}
                value={name}
                onChangeText={setName}
              />
              <FieldInput
                accentBorder
                keyboardType="decimal-pad"
                label={t("invoice.labelTotal")}
                value={amount}
                onChangeText={setAmount}
              />
              <FieldInput
                accentBorder
                label={t("invoice.labelPayer")}
                value={payer}
                onChangeText={setPayer}
                placeholder={t("invoice.payerCustomPlaceholder")}
              />
            </View>

            <View className="mt-5 flex-row gap-3">
              <View className="min-w-0 flex-1">
                <Button
                  label={t("common.cancel")}
                  variant="secondary"
                  onPress={onClose}
                />
              </View>
              <View className="min-w-0 flex-1">
                <Button
                  disabled={!canSubmit || isSubmitting}
                  label={t("invoice.pushToSheetConfirm")}
                  loading={isSubmitting}
                  onPress={() => void handleSubmit()}
                />
              </View>
            </View>
          </Card>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
