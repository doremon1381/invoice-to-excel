import { useRouter } from 'expo-router';
import { Image, Pressable, View } from 'react-native';

import { ThemedText } from '@/components/shared/themed-text';
import { ThemedView } from '@/components/shared/themed-view';
import { IconSymbol } from '@/components/shared/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useInvoiceScan } from '@/hooks/scan/useInvoiceScan';

export default function ScanScreen() {
  const router = useRouter();
  const colors = Colors.dark;
  const { error, isLoading, pickFromLibrary, previewData, previewUri, setError, takePhoto } = useInvoiceScan();
  const summaryVendor = previewData?.extracted.vendor_name ?? null;
  const summaryDate = previewData?.extracted.invoice_date ?? null;
  const summaryTotal = previewData?.extracted.total_amount;
  const summaryStatus = error ? 'error' : isLoading ? 'reading' : previewData?.status ?? (previewUri ? 'ready' : 'idle');
  const summarySnippet = previewData?.rawText?.slice(0, 42)?.replace(/\s+/g, ' ');

  async function handleScanAction(
    action: () => Promise<{ invoiceId: number; imageUri: string } | null>,
    errorTitle: string,
    fallbackMessage: string,
  ) {
    try {
      const result = await action();
      if (result) {
        router.push(`/invoice/${result.invoiceId}`);
      }
    } catch (caughtError) {
      //Alert.alert(errorTitle, caughtError instanceof Error ? caughtError.message : fallbackMessage);
    }
  }

  async function handleTakePhoto() {
    await handleScanAction(takePhoto, 'Scan failed', 'Unable to scan invoice.');
  }

  async function handlePickImage() {
    await handleScanAction(pickFromLibrary, 'Import failed', 'Unable to import invoice.');
  }

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: colors.background, paddingBottom: 80 }}>
      <View className="flex-1 px-5 pb-10 pt-4">
        <View className="flex-row items-center justify-between">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.back()}
            style={({ pressed }) => ({ backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 })}>
            <IconSymbol name="chevron.left" size={18} color={colors.text} />
          </Pressable>

          <ThemedText style={{ color: colors.tint, fontSize: 18, fontWeight: '700' }}>
            {isLoading ? 'TRANSLATING...' : 'READY TO SCAN'}
          </ThemedText>

          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.push('/settings')}
            style={({ pressed }) => ({ backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 })}>
            <IconSymbol name="gearshape.fill" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View className="mt-6 flex-1 items-center justify-center">
          <View
            className="w-full max-w-[360px] rounded-[30px] border p-3"
            style={{ backgroundColor: '#232D40', borderColor: colors.border }}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} className="aspect-[3/4] w-full rounded-[24px]" resizeMode="cover" />
            ) : (
              <View className="aspect-[3/4] w-full items-center justify-center rounded-[24px]" style={{ backgroundColor: '#1A2233' }}>
                <IconSymbol name="camera.fill" size={42} color={colors.icon} />
                <ThemedText className="mt-4" style={{ color: colors.muted }}>
                  Capture or import an invoice to extract with AI.
                </ThemedText>
              </View>
            )}
          </View>

          <View
            className="absolute bottom-10 right-2 w-[220px] rounded-[24px] border px-4 py-4"
            style={{ backgroundColor: 'rgba(17, 24, 38, 0.94)', borderColor: '#32415D' }}>
            <ThemedText style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>EXTRACTION SUMMARY</ThemedText>
            <View className="mt-3 gap-2">
              <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
                {`"vendor": ${summaryVendor ? `"${summaryVendor}"` : 'null'}`}
              </ThemedText>
              <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
                {`"date": ${summaryDate ? `"${summaryDate}"` : 'null'}`}
              </ThemedText>
              <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
                {`"total": ${summaryTotal !== null && summaryTotal !== undefined ? `"${summaryTotal.toFixed(2)} ${previewData?.extracted.currency ?? 'VND'}"` : 'null'}`}
              </ThemedText>
              <ThemedText style={{ color: colors.muted, fontSize: 12 }}>
                {`"status": "${summaryStatus}"`}
              </ThemedText>
              {!summaryVendor && summarySnippet ? (
                <ThemedText style={{ color: colors.muted, fontSize: 11 }}>
                  {`"text": "${summarySnippet}${previewData?.rawText.length && previewData.rawText.length > 42 ? '…' : ''}"`}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </View>

        {error ? (
          <View className="mb-5 rounded-[24px] border px-4 py-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
          </View>
        ) : null}

        <View className="flex-row items-end justify-between gap-5">
          <Pressable
            className="h-14 w-14 items-center justify-center rounded-2xl border"
            onPress={() => void handlePickImage()}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            })}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} className="h-10 w-10 rounded-xl" resizeMode="cover" />
            ) : (
              <IconSymbol name="square.and.arrow.up.fill" size={22} color={colors.text} />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            className="h-24 w-24 items-center justify-center rounded-full border-[6px]"
            onPress={() => void handleTakePhoto()}
            style={({ pressed }) => ({
              backgroundColor: '#77AFFF',
              borderColor: '#C5DCFF',
              opacity: pressed ? 0.9 : 1,
            })}>
            <View className="h-16 w-16 rounded-full border-2" style={{ borderColor: '#E8F1FF' }} />
          </Pressable>

          <Pressable
            className="h-14 w-14 items-center justify-center rounded-full border"
            onPress={() => setError(null)}
            style={({ pressed }) => ({
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            })}>
            <IconSymbol name="arrow.clockwise" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>
    </ThemedView>
  );
}
