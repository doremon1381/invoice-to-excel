import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FinancialSummary } from "@/components/invoice/FinancialSummary";
import { LoadingOverlay } from "@/components/scan/LoadingOverlay";
import { ThemedText } from "@/components/shared/themed-text";
import { ThemedView } from "@/components/shared/themed-view";
import { Button } from "@/components/shared/ui/Button";
import { Card } from "@/components/shared/ui/Card";
import { FieldInput } from "@/components/shared/ui/FieldInput";
import { IconSymbol } from "@/components/shared/ui/icon-symbol";
import { NumberBadge } from "@/components/shared/ui/NumberBadge";
import { ScreenContainer } from "@/components/shared/ui/ScreenContainer";
import { Colors } from "@/constants/theme";
import { useInvoiceExport } from "@/hooks/invoice/useInvoiceExport";
import { usePushInvoiceToSheet } from "@/hooks/invoice/usePushInvoiceToSheet";
import { useColorScheme } from "@/hooks/theme/use-color-scheme";
import {
  deleteInvoice,
  getInvoiceById,
  saveInvoice,
  updateInvoice,
} from "@/lib/db";
import {
  buildInvoiceTitleSuggestion,
  normalizeInvoiceTitle,
  normalizePaymentMethod,
} from "@/lib/invoice";
import {
  GoogleSheetConfigRequiredError,
  InvoiceAlreadySyncedError,
} from "@/lib/invoiceSheetSync";
import {
  clearPendingScan,
  getPendingScan,
  type PendingScanPayload,
} from "@/lib/pendingScan";
import { GoogleAuthRequiredError } from "@/lib/googleAuth";
import type {
  ExtractedInvoice,
  InvoiceDetail,
  InvoiceStatus,
  LineItem,
  PaymentMethod,
  SheetSyncStatus,
} from "@/lib/types";

type EditableLineItem = {
  id?: number;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  total_price: string;
};

function toInputString(value: number | string | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

function toEditableLineItem(item?: LineItem): EditableLineItem {
  return {
    id: item?.id,
    description: item?.description ?? "",
    quantity: toInputString(item?.quantity),
    unit: item?.unit ?? "",
    unit_price: toInputString(item?.unit_price),
    total_price: toInputString(item?.total_price),
  };
}

function parseNullableNumber(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isEditableLineItemEmpty(item: EditableLineItem): boolean {
  return (
    !item.description.trim() &&
    !item.quantity.trim() &&
    !item.unit.trim() &&
    !item.unit_price.trim() &&
    !item.total_price.trim()
  );
}

function toPersistedLineItem(item: EditableLineItem): LineItem {
  return {
    id: item.id,
    description: item.description.trim(),
    quantity: parseNullableNumber(item.quantity),
    unit: item.unit.trim() || null,
    unit_price: parseNullableNumber(item.unit_price),
    total_price: parseNullableNumber(item.total_price),
  };
}

function deriveEditableStatus(fields: {
  invoice_date: string | null;
  invoice_number: string | null;
  total_amount: number | null;
  vendor_name: string | null;
}): InvoiceStatus {
  const score = [
    fields.vendor_name,
    fields.invoice_number,
    fields.invoice_date,
    fields.total_amount !== null && fields.total_amount !== undefined
      ? String(fields.total_amount)
      : null,
  ].filter(Boolean).length;

  return score >= 2 ? "success" : "pending";
}

function getStatusColor(
  status: InvoiceStatus,
  colors: (typeof Colors)[keyof typeof Colors],
): string {
  if (status === "success") {
    return colors.success;
  }

  if (status === "error") {
    return colors.danger;
  }

  return colors.warning;
}

function getSheetSyncColor(
  status: SheetSyncStatus,
  colors: (typeof Colors)[keyof typeof Colors],
): string {
  if (status === "synced") {
    return colors.success;
  }

  if (status === "failed") {
    return colors.danger;
  }

  return colors.warning;
}

function buildPreviewInvoice(payload: PendingScanPayload): InvoiceDetail {
  return {
    id: 0,
    invoiceTitle: payload.invoiceTitle,
    image_uri: payload.imageUri,
    image_base64: payload.imageBase64,
    image_mime: payload.imageMime,
    raw_text: payload.rawText,
    scanned_at: payload.scannedAt,
    status: payload.status,
    sheet_sync_status: "not_synced",
    sheet_synced_at: null,
    sheet_last_error: null,
    ...payload.extracted,
  };
}

function getPaymentMethodLabel(
  value: PaymentMethod,
  t: (key: string) => string,
): string {
  if (value === "bank_transfer") {
    return t("invoice.paymentMethodBankTransfer");
  }

  if (value === "cash") {
    return t("invoice.paymentMethodCash");
  }

  return t("invoice.paymentMethodUnset");
}

function getSheetSyncLabel(
  value: SheetSyncStatus,
  t: (key: string) => string,
): string {
  if (value === "synced") {
    return t("invoice.sheetSyncSynced");
  }

  if (value === "failed") {
    return t("invoice.sheetSyncFailed");
  }

  return t("invoice.sheetSyncNotSynced");
}

function formatDateTimeValue(value: string | null): string {
  return value ? value.replace("T", " ").replace("Z", "") : "—";
}

function getDisplayValue(value: string | null): string {
  return value?.trim() ? value : "—";
}

export default function InvoiceDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPreviewMode = id === "new";
  const invoiceId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { exportSingle, isExporting } = useInvoiceExport();
  const { isPushing, pushInvoice } = usePushInvoiceToSheet();

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [headerImageUri, setHeaderImageUri] = useState<string | null>(null);

  const [invoiceTitle, setInvoiceTitle] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [totalAmountStr, setTotalAmountStr] = useState("");
  const [payer, setPayer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const loadInvoice = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isPreviewMode) {
        const pendingScan = getPendingScan();

        if (!pendingScan) {
          setInvoice(null);
          setError(t("invoice.pendingScanMissing"));
          return;
        }

        setInvoice(buildPreviewInvoice(pendingScan));
        return;
      }

      const nextInvoice = await getInvoiceById(invoiceId);
      setInvoice(nextInvoice);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t("invoice.loadError"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, isPreviewMode, t]);

  useFocusEffect(
    useCallback(() => {
      void loadInvoice();
    }, [loadInvoice]),
  );

  useEffect(() => {
    if (!isPreviewMode) {
      return;
    }

    return () => {
      clearPendingScan();
    };
  }, [isPreviewMode]);

  useEffect(() => {
    if (!invoice) {
      setHeaderImageUri(null);
      return;
    }

    setHeaderImageUri(invoice.image_uri);
    setInvoiceTitle(
      isPreviewMode
        ? buildInvoiceTitleSuggestion(invoice, invoice.invoiceTitle) ?? ""
        : normalizeInvoiceTitle(invoice.invoiceTitle) ?? "",
    );
    setVendorName(invoice.vendor_name ?? "");
    setVendorAddress(invoice.vendor_address ?? "");
    setInvoiceDate(invoice.invoice_date ?? "");
    setTotalAmountStr(toInputString(invoice.total_amount));
    setPayer(invoice.payer ?? "");
    setPaymentMethod(normalizePaymentMethod(invoice.payment_method));
    setNotes(invoice.notes ?? "");
    setLineItems(
      invoice.line_items.length > 0
        ? invoice.line_items.map(toEditableLineItem)
        : [],
    );
  }, [invoice, isPreviewMode]);

  function updateLineItemField(
    index: number,
    key: keyof EditableLineItem,
    value: string,
  ) {
    setLineItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  }

  function addLineItem() {
    setLineItems((current) => [...current, toEditableLineItem()]);
  }

  function removeLineItem(index: number) {
    setLineItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function showSoftWarning(missingLabels: string[]): Promise<boolean> {
    return await new Promise((resolve) => {
      Alert.alert(
        t("invoice.softWarningTitle"),
        `${t("invoice.softWarningMessage")}\n\n${missingLabels
          .map((label) => `• ${label}`)
          .join("\n")}`,
        [
          {
            style: "cancel",
            text: t("invoice.softWarningEdit"),
            onPress: () => resolve(false),
          },
          {
            text: t("invoice.softWarningContinue"),
            onPress: () => resolve(true),
          },
        ],
        { cancelable: false },
      );
    });
  }

  function buildExtractedPayload(sourceInvoice: InvoiceDetail): {
    extracted: ExtractedInvoice;
    status: InvoiceStatus;
    trimmedInvoiceTitle: string | null;
    missingLabels: string[];
  } {
    const totalAmount = parseNullableNumber(totalAmountStr);
    const persistedLineItems = lineItems
      .filter((item) => !isEditableLineItemEmpty(item))
      .map(toPersistedLineItem);

    const extracted: ExtractedInvoice = {
      vendor_name: vendorName.trim() || null,
      vendor_address: vendorAddress.trim() || null,
      invoice_number: sourceInvoice.invoice_number,
      invoice_date: invoiceDate.trim() || null,
      due_date: sourceInvoice.due_date,
      subtotal: sourceInvoice.subtotal,
      tax_amount: sourceInvoice.tax_amount,
      discount_amount: sourceInvoice.discount_amount,
      total_amount: totalAmount,
      currency: sourceInvoice.currency,
      payer: payer.trim() || null,
      payment_method: paymentMethod,
      notes: notes.trim() || null,
      line_items: persistedLineItems,
    };

    const status = deriveEditableStatus({
      vendor_name: extracted.vendor_name,
      invoice_number: extracted.invoice_number,
      invoice_date: extracted.invoice_date,
      total_amount: extracted.total_amount,
    });
    const trimmedInvoiceTitle = normalizeInvoiceTitle(invoiceTitle);

    const missingLabels: string[] = [];

    if (!trimmedInvoiceTitle) {
      missingLabels.push(t("invoice.labelInvoiceTitle"));
    }

    if (!extracted.vendor_name) {
      missingLabels.push(t("invoice.labelVendor"));
    }

    if (!extracted.invoice_date) {
      missingLabels.push(t("invoice.labelDate"));
    }

    if (extracted.total_amount === null) {
      missingLabels.push(t("invoice.labelTotal"));
    }

    return {
      extracted,
      status,
      trimmedInvoiceTitle,
      missingLabels,
    };
  }

  async function handleExport() {
    if (isPreviewMode) {
      return;
    }

    try {
      await exportSingle(invoiceId);
    } catch (caughtError) {
      Alert.alert(
        t("invoice.alertExportFailed"),
        caughtError instanceof Error
          ? caughtError.message
          : t("invoice.alertExportFailedMessage"),
      );
    }
  }

  function openSettingsAction() {
    return {
      text: t("tabs.settings"),
      onPress: () => router.push("/(tabs)/settings"),
    };
  }

  async function handlePushToSheet() {
    if (!invoice) {
      return;
    }

    try {
      const pushedInvoice = await pushInvoice(invoice);
      setInvoice(pushedInvoice);
      Alert.alert(
        t("invoice.pushToSheetSuccessTitle"),
        t("invoice.pushToSheetSuccessMessage"),
      );
    } catch (caughtError) {
      if (caughtError instanceof InvoiceAlreadySyncedError) {
        Alert.alert(
          t("invoice.alreadySyncedTitle"),
          t("invoice.alreadySyncedMessage"),
        );
        return;
      }

      if (caughtError instanceof GoogleAuthRequiredError) {
        Alert.alert(
          t("invoice.pushToSheetAuthRequiredTitle"),
          t("invoice.pushToSheetAuthRequiredMessage"),
          [{ text: t("common.cancel"), style: "cancel" }, openSettingsAction()],
        );
        return;
      }

      if (caughtError instanceof GoogleSheetConfigRequiredError) {
        Alert.alert(
          t("invoice.pushToSheetConfigRequiredTitle"),
          t("invoice.pushToSheetConfigRequiredMessage"),
          [{ text: t("common.cancel"), style: "cancel" }, openSettingsAction()],
        );
        return;
      }

      if (!isPreviewMode) {
        try {
          setInvoice(await getInvoiceById(invoice.id));
        } catch {
          // Keep the existing state if refresh fails.
        }
      }

      Alert.alert(
        t("invoice.pushToSheetFailedTitle"),
        caughtError instanceof Error
          ? caughtError.message
          : t("invoice.alertSaveFailedMessage"),
      );
    }
  }

  function handleDelete() {
    Alert.alert(
      t("invoice.alertDeleteTitle"),
      t("invoice.alertDeleteMessage"),
      [
        { style: "cancel", text: t("common.cancel") },
        {
          style: "destructive",
          text: t("common.delete"),
          onPress: async () => {
            try {
              await deleteInvoice(invoiceId);
              router.replace("/");
            } catch {
              Alert.alert(
                t("invoice.alertDeleteFailed"),
                t("invoice.alertDeleteFailedMessage"),
              );
            }
          },
        },
      ],
    );
  }

  async function handleConfirm() {
    if (!invoice) {
      return;
    }

    const { extracted, status, trimmedInvoiceTitle, missingLabels } =
      buildExtractedPayload(invoice);

    if (missingLabels.length > 0) {
      const shouldContinue = await showSoftWarning(missingLabels);

      if (!shouldContinue) {
        return;
      }
    }

    setIsSaving(true);

    try {
      if (isPreviewMode) {
        const savedId = await saveInvoice({
          invoiceTitle: trimmedInvoiceTitle,
          imageUri: invoice.image_uri,
          imageBase64: invoice.image_base64,
          imageMime: invoice.image_mime,
          rawText: invoice.raw_text ?? "",
          scannedAt: invoice.scanned_at,
          status,
          extracted,
        });

        const savedInvoice = await getInvoiceById(savedId);

        try {
          await pushInvoice(savedInvoice);
          clearPendingScan();
          router.replace("/");
        } catch (syncError) {
          clearPendingScan();
          const message =
            syncError instanceof Error
              ? syncError.message
              : t("invoice.localSavedSheetFailedFallback");

          Alert.alert(
            t("invoice.localSavedSheetFailedTitle"),
            t("invoice.localSavedSheetFailedMessage", { message }),
            [
              {
                text: t("common.close"),
                onPress: () => router.replace(`/invoice/${savedId}`),
              },
            ],
          );
        }

        return;
      }

      await updateInvoice(invoiceId, {
        invoiceTitle: trimmedInvoiceTitle,
        extracted,
        status,
      });

      const refreshedInvoice = await getInvoiceById(invoiceId);
      setInvoice(refreshedInvoice);
    } catch (caughtError) {
      Alert.alert(
        t("invoice.alertSaveFailed"),
        caughtError instanceof Error
          ? caughtError.message
          : t("invoice.alertSaveFailedMessage"),
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <ScreenContainer padded={false}>
        <LoadingOverlay message={t("invoice.loading")} />
      </ScreenContainer>
    );
  }

  if (error || !invoice) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ThemedText>{error ?? t("invoice.notFound")}</ThemedText>
        <Button
          className="mt-3"
          label={isPreviewMode ? t("invoice.rescan") : t("common.retry")}
          variant="secondary"
          onPress={() => {
            if (isPreviewMode) {
              router.replace("/(tabs)/scan");
              return;
            }

            void loadInvoice();
          }}
        />
      </ScreenContainer>
    );
  }

  const fallbackImageUri = invoice.image_base64
    ? `data:${invoice.image_mime ?? "image/jpeg"};base64,${invoice.image_base64}`
    : null;
  const activeHeaderImageUri = headerImageUri ?? invoice.image_uri;
  const pushButtonLabel =
    invoice.sheet_sync_status === "failed"
      ? t("invoice.retryPushToSheet")
      : t("invoice.pushToSheet");

  return (
    <ThemedView className="flex-1">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 132,
          paddingHorizontal: 20,
          paddingTop: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel={t("invoice.goBackA11y")}
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.back()}
            style={({ pressed }) => ({
              backgroundColor: colors.surfaceAlt,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <IconSymbol
              name="chevron.left"
              size={22}
              color={colors.foreground}
            />
          </Pressable>

          <View className="flex-row items-center gap-2">
            {isPreviewMode ? null : (
              <>
                <Button
                  disabled={isPushing || invoice.sheet_sync_status === "synced"}
                  label={pushButtonLabel}
                  size="sm"
                  variant="secondary"
                  onPress={() => void handlePushToSheet()}
                />
                <Button
                  disabled={isExporting || isPushing}
                  label={isExporting ? t("invoice.exporting") : t("invoice.export")}
                  size="sm"
                  variant="secondary"
                  onPress={() => void handleExport()}
                />
              </>
            )}
            <Image
              source={{ uri: activeHeaderImageUri }}
              className="h-12 w-12 rounded-xl border"
              style={{ borderColor: colors.border }}
              onError={() => {
                if (fallbackImageUri && activeHeaderImageUri !== fallbackImageUri) {
                  setHeaderImageUri(fallbackImageUri);
                }
              }}
            />
          </View>
        </View>

        <ThemedText
          className="mt-6"
          type="defaultSemiBold"
          style={{ letterSpacing: 0.6, textTransform: "uppercase" }}
        >
          {isPreviewMode
            ? t("invoice.reviewBeforeSave")
            : t("invoice.structuredReview")}
        </ThemedText>
        <ThemedText className="mt-1" style={{ color: colors.muted }}>
          {isPreviewMode
            ? t("invoice.reviewBeforeSaveHint")
            : t("invoice.structuredReviewHint")}
        </ThemedText>

        <Card className="mt-6 rounded-3xl border p-5" tone="accentSoft">
          <View className="mb-4 flex-row items-center gap-3">
            <NumberBadge value={1} />
            <ThemedText
              type="defaultSemiBold"
              style={{ letterSpacing: 1, textTransform: "uppercase" }}
            >
              {t("invoice.reviewFields")}
            </ThemedText>
          </View>

          <View className="gap-4">
            <FieldInput
              label={t("invoice.labelInvoiceTitle")}
              onChangeText={setInvoiceTitle}
              placeholder={t("invoice.placeholderInvoiceTitle")}
              value={invoiceTitle}
            />
            <FieldInput
              label={t("invoice.labelVendor")}
              onChangeText={setVendorName}
              value={vendorName}
            />
            <FieldInput
              label={t("invoice.labelVendorAddress")}
              onChangeText={setVendorAddress}
              placeholder={t("invoice.placeholderVendorAddress")}
              value={vendorAddress}
            />
            <View className="flex-row gap-3">
              <View className="min-w-0 flex-1">
                <FieldInput
                  accentBorder
                  label={t("invoice.labelDate")}
                  onChangeText={setInvoiceDate}
                  placeholder={t("invoice.placeholderInvoiceDate")}
                  value={invoiceDate}
                />
              </View>
              <View className="min-w-0 flex-1">
                <FieldInput
                  accentBorder
                  keyboardType="decimal-pad"
                  label={t("invoice.labelTotal")}
                  onChangeText={setTotalAmountStr}
                  placeholder={t("invoice.placeholderTotalAmount")}
                  value={totalAmountStr}
                />
              </View>
            </View>
            <FieldInput
              label={t("invoice.labelPayer")}
              onChangeText={setPayer}
              placeholder={t("invoice.placeholderPayer")}
              value={payer}
            />

            <View className="gap-2">
              <ThemedText style={{ color: colors.muted }}>
                {t("invoice.paymentMethod")}
              </ThemedText>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { value: null as PaymentMethod, label: t("invoice.paymentMethodUnset") },
                  {
                    value: "bank_transfer" as PaymentMethod,
                    label: t("invoice.paymentMethodBankTransfer"),
                  },
                  { value: "cash" as PaymentMethod, label: t("invoice.paymentMethodCash") },
                ].map((option) => {
                  const isActive = paymentMethod === option.value;

                  return (
                    <Pressable
                      key={`${option.label}-${String(option.value)}`}
                      className="rounded-full border px-3 py-2"
                      onPress={() => setPaymentMethod(option.value)}
                      style={{
                        backgroundColor: isActive ? colors.accent : colors.background,
                        borderColor: isActive ? colors.accent : colors.border,
                      }}
                    >
                      <ThemedText
                        type="custom"
                        className="text-sm"
                        style={{
                          color: isActive ? colors.onAccent : colors.foreground,
                        }}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Card>

        <Card className="mt-5 rounded-3xl border p-5" tone="accentSoft">
          <View className="mb-4 flex-row items-center gap-3">
            <NumberBadge value={2} />
            <ThemedText
              type="defaultSemiBold"
              style={{ letterSpacing: 1, textTransform: "uppercase" }}
            >
              {t("invoice.notes")}
            </ThemedText>
          </View>

          <View
            className="rounded-[18px] border px-3 py-3"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <TextInput
              multiline
              numberOfLines={5}
              onChangeText={setNotes}
              placeholder={t("invoice.placeholderNotes")}
              placeholderTextColor={colors.muted}
              style={{
                color: colors.foreground,
                minHeight: 108,
                textAlignVertical: "top",
              }}
              value={notes}
            />
          </View>
        </Card>

        <Card className="mt-5 rounded-3xl border p-5" tone="accentSoft">
          <View className="mb-4 flex-row items-center justify-between gap-3">
            <View className="flex-row items-center gap-3">
              <NumberBadge value={3} />
              <ThemedText
                type="defaultSemiBold"
                style={{ letterSpacing: 1, textTransform: "uppercase" }}
              >
                {t("invoice.lineItems")}
              </ThemedText>
            </View>
            <Button
              label={t("invoice.addLineItem")}
              size="sm"
              variant="secondary"
              onPress={addLineItem}
            />
          </View>

          {lineItems.length === 0 ? (
            <ThemedText style={{ color: colors.muted }}>
              {t("invoice.noLineItemsEditable")}
            </ThemedText>
          ) : (
            <View className="gap-4">
              {lineItems.map((item, index) => (
                <View
                  key={`${item.id ?? "new"}-${index}`}
                  className="rounded-2xl border p-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                >
                  <View className="mb-3 flex-row items-center justify-between">
                    <ThemedText type="defaultSemiBold">
                      {t("invoice.lineItemLabel", { index: index + 1 })}
                    </ThemedText>
                    <Pressable onPress={() => removeLineItem(index)}>
                      <ThemedText style={{ color: colors.danger }}>
                        {t("invoice.removeLineItem")}
                      </ThemedText>
                    </Pressable>
                  </View>

                  <View className="gap-3">
                    <FieldInput
                      label={t("invoice.lineItemDescription")}
                      onChangeText={(value) =>
                        updateLineItemField(index, "description", value)
                      }
                      value={item.description}
                    />
                    <View className="flex-row gap-3">
                      <View className="min-w-0 flex-1">
                        <FieldInput
                          keyboardType="decimal-pad"
                          label={t("invoice.lineItemQuantity")}
                          onChangeText={(value) =>
                            updateLineItemField(index, "quantity", value)
                          }
                          value={item.quantity}
                        />
                      </View>
                      <View className="min-w-0 flex-1">
                        <FieldInput
                          label={t("invoice.lineItemUnit")}
                          onChangeText={(value) =>
                            updateLineItemField(index, "unit", value)
                          }
                          value={item.unit}
                        />
                      </View>
                    </View>
                    <View className="flex-row gap-3">
                      <View className="min-w-0 flex-1">
                        <FieldInput
                          keyboardType="decimal-pad"
                          label={t("invoice.lineItemUnitPrice")}
                          onChangeText={(value) =>
                            updateLineItemField(index, "unit_price", value)
                          }
                          value={item.unit_price}
                        />
                      </View>
                      <View className="min-w-0 flex-1">
                        <FieldInput
                          keyboardType="decimal-pad"
                          label={t("invoice.lineItemTotalPrice")}
                          onChangeText={(value) =>
                            updateLineItemField(index, "total_price", value)
                          }
                          value={item.total_price}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        <Card className="mt-5 rounded-3xl border p-5">
          <View className="gap-3">
            <SummaryRow
              label={t("invoice.currency")}
              labelColor={colors.muted}
              value={invoice.currency || "—"}
            />
            <SummaryRow
              label={t("invoice.paymentMethod")}
              labelColor={colors.muted}
              value={getPaymentMethodLabel(paymentMethod, t)}
            />
            <SummaryRow
              label={t("invoice.status")}
              labelColor={colors.muted}
              value={t(`invoice.status${invoice.status[0].toUpperCase()}${invoice.status.slice(1)}`)}
              valueColor={getStatusColor(invoice.status, colors)}
            />
            <SummaryRow
              label={t("invoice.sheetSyncStatus")}
              labelColor={colors.muted}
              value={getSheetSyncLabel(invoice.sheet_sync_status, t)}
              valueColor={getSheetSyncColor(invoice.sheet_sync_status, colors)}
            />
            <SummaryRow
              label={t("invoice.scannedAt")}
              labelColor={colors.muted}
              value={formatDateTimeValue(invoice.scanned_at)}
            />
            {invoice.sheet_synced_at ? (
              <SummaryRow
                label={t("invoice.sheetSyncedAt")}
                labelColor={colors.muted}
                value={formatDateTimeValue(invoice.sheet_synced_at)}
              />
            ) : null}
            {invoice.sheet_last_error ? (
              <View className="gap-1">
                <ThemedText style={{ color: colors.muted }}>
                  {t("invoice.sheetLastError")}
                </ThemedText>
                <ThemedText style={{ color: colors.danger }}>
                  {invoice.sheet_last_error}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </Card>

        <Card className="mt-5 rounded-3xl border p-5">
          <ThemedText type="subtitle">{t("invoice.extractionDetails")}</ThemedText>
          <View className="mt-4 gap-3">
            <SummaryRow
              label={t("invoice.invoiceNumber")}
              labelColor={colors.muted}
              value={getDisplayValue(invoice.invoice_number)}
            />
            <SummaryRow
              label={t("invoice.dueDate")}
              labelColor={colors.muted}
              value={getDisplayValue(invoice.due_date)}
            />
            <View className="gap-1">
              <ThemedText style={{ color: colors.muted }}>
                {t("invoice.rawExtractionText")}
              </ThemedText>
              <ThemedText style={{ color: colors.foreground }}>
                {invoice.raw_text?.trim()
                  ? invoice.raw_text
                  : t("invoice.noRawText")}
              </ThemedText>
            </View>
          </View>
        </Card>

        <FinancialSummary
          currency={invoice.currency}
          discountAmount={invoice.discount_amount}
          subtotal={invoice.subtotal}
          taxAmount={invoice.tax_amount}
          totalAmount={parseNullableNumber(totalAmountStr)}
        />

        {isPreviewMode ? null : (
          <Button
            label={t("invoice.deleteInvoice")}
            style={{ marginTop: 20 }}
            variant="destructive"
            onPress={handleDelete}
          />
        )}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 gap-3 border-t px-5 pt-3"
        style={{
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <Button
          disabled={isSaving}
          label={isPreviewMode ? t("invoice.confirm") : t("invoice.saveChanges")}
          loading={isSaving}
          onPress={() => void handleConfirm()}
        />
        {isPreviewMode ? (
          <Button
            label={t("invoice.rescan")}
            variant="secondary"
            onPress={() => {
              clearPendingScan();
              router.replace("/(tabs)/scan");
            }}
          />
        ) : null}
      </View>
    </ThemedView>
  );
}

function SummaryRow({
  label,
  labelColor,
  value,
  valueColor,
}: {
  label: string;
  labelColor?: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <ThemedText style={labelColor ? { color: labelColor } : undefined}>
        {label}
      </ThemedText>
      <ThemedText
        type="defaultSemiBold"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </ThemedText>
    </View>
  );
}
