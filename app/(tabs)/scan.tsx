import { useRouter } from 'expo-router';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';

import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ScanButton } from '@/components/ScanButton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useInvoiceScan } from '@/hooks/useInvoiceScan';
import { useStoredApiKey } from '@/hooks/useStoredApiKey';

export default function ScanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { apiKey } = useStoredApiKey();
  const { error, isLoading, pickFromLibrary, previewUri, setError, takePhoto } = useInvoiceScan();

  async function handleTakePhoto() {
    try {
      const result = await takePhoto(apiKey);

      if (result) {
        router.push(`/invoice/${result.invoiceId}`);
      }
    } catch (caughtError) {
      Alert.alert('Scan failed', caughtError instanceof Error ? caughtError.message : 'Unable to scan invoice.');
    }
  }

  async function handlePickImage() {
    try {
      const result = await pickFromLibrary(apiKey);

      if (result) {
        router.push(`/invoice/${result.invoiceId}`);
      }
    } catch (caughtError) {
      Alert.alert('Import failed', caughtError instanceof Error ? caughtError.message : 'Unable to import invoice.');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">Scan Invoice</ThemedText>
        <ThemedText style={[styles.description, { color: colors.muted }]}>Take a photo or choose an invoice image from your gallery.</ThemedText>

        <View style={styles.actions}>
          <ScanButton label="Take Photo" onPress={handleTakePhoto} />
          <ScanButton label="Choose from Gallery" onPress={handlePickImage} />
        </View>

        {previewUri ? <Image source={{ uri: previewUri }} style={[styles.previewImage, { borderColor: colors.border }]} /> : null}

        {error ? (
          <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ThemedText style={{ color: colors.danger }}>{error}</ThemedText>
            <ScanButton label="Clear error" onPress={() => setError(null)} />
          </View>
        ) : null}
      </ScrollView>

      {isLoading ? <LoadingOverlay message="Extracting invoice data…" /> : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 20,
  },
  description: {
    marginTop: 4,
  },
  actions: {
    gap: 12,
    marginTop: 12,
  },
  previewImage: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    width: '100%',
  },
  errorCard: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
});
