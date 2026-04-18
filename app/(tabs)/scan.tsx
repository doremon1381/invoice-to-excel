import { useRouter } from 'expo-router';
import { Alert, Image, ScrollView, View } from 'react-native';

import { LoadingOverlay } from '@/components/scan/LoadingOverlay';
import { ScanButton } from '@/components/scan/ScanButton';
import { ThemedText } from '@/components/shared/themed-text';
import { ThemedView } from '@/components/shared/themed-view';
import { Colors } from '@/constants/theme';
import { useInvoiceScan } from '@/hooks/scan/useInvoiceScan';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

export default function ScanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { error, isLoading, pickFromLibrary, previewUri, setError, takePhoto } = useInvoiceScan();

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
      Alert.alert(errorTitle, caughtError instanceof Error ? caughtError.message : fallbackMessage);
    }
  }

  async function handleTakePhoto() {
    await handleScanAction(takePhoto, 'Scan failed', 'Unable to scan invoice.');
  }

  async function handlePickImage() {
    await handleScanAction(pickFromLibrary, 'Import failed', 'Unable to import invoice.');
  }

  return (
    <ThemedView className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView contentContainerClassName="px-5 pb-8 pt-4">
        <View className="gap-2">
          <ThemedText type="title">Scan invoice</ThemedText>
          <ThemedText style={{ color: colors.muted }}>
            Capture or import an invoice image, send it to your PaddleOCR Docker server, and store the detected text locally.
          </ThemedText>
        </View>

        <View className="mt-6 gap-3">
          <ScanButton label="Take Photo" onPress={handleTakePhoto} />
          <ScanButton label="Choose from Gallery" onPress={handlePickImage} />
        </View>

        {previewUri ? (
          <View className="mt-6 rounded-3xl border p-3" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <ThemedText type="defaultSemiBold" style={{ marginBottom: 12 }}>
              Preview
            </ThemedText>
            <Image source={{ uri: previewUri }} className="aspect-square w-full rounded-2xl" style={{ borderColor: colors.border }} />
          </View>
        ) : null}

        <View className="mt-6 rounded-3xl border p-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          <ThemedText type="defaultSemiBold">Current OCR setup</ThemedText>
          <ThemedText className="mt-2" style={{ color: colors.muted }}>
            Anthropic extraction is preserved in the codebase for later, but the active scan flow now uses the PaddleOCR Docker server only.
          </ThemedText>
        </View>

        {error ? (
          <View className="mt-6 rounded-3xl border p-4" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
            <View className="mt-3">
              <ScanButton label="Clear error" onPress={() => setError(null)} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {isLoading ? <LoadingOverlay message="Reading invoice text…" /> : null}
    </ThemedView>
  );
}
