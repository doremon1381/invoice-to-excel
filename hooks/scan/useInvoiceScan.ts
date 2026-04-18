import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerAsset, MediaTypeOptions } from 'expo-image-picker';

// import { extractInvoiceData } from '@/lib/anthropic';
import { saveInvoice } from '@/lib/db';
import { runPaddleOCR } from '@/lib/ocr';
import { parseOcrText } from '@/lib/parser';
import { Storage } from '@/lib/storage';

interface ScanResult {
  invoiceId: number;
  imageUri: string;
}

export function useInvoiceScan() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const processAsset = useCallback(async (asset: ImagePickerAsset): Promise<ScanResult> => {
    const serverUrl = await Storage.getOCRServerUrl();

    if (!serverUrl) {
      throw new Error('Please save your PaddleOCR server URL before scanning.');
    }

    setIsLoading(true);
    setError(null);

    try {
      setPreviewUri(asset.uri);
      const ocrResult = await runPaddleOCR(asset.uri, serverUrl);

      if (!ocrResult.full_text.trim()) {
        throw new Error('No text was found in the invoice image. Try a clearer photo.');
      }

      const { extracted, status } = parseOcrText(ocrResult.full_text);
      const invoiceId = await saveInvoice({
        imageUri: asset.uri,
        rawText: ocrResult.full_text,
        status,
        extracted,
      });

      return {
        invoiceId,
        imageUri: asset.uri,
      };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to scan invoice.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickFromLibrary = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Photo library permission is required to choose an invoice image.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    return processAsset(result.assets[0]);
  }, [processAsset]);

  const takePhoto = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      throw new Error('Camera permission is required to take an invoice photo.');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      cameraType: ImagePicker.CameraType.back,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    return processAsset(result.assets[0]);
  }, [processAsset]);

  return {
    error,
    isLoading,
    pickFromLibrary,
    previewUri,
    setError,
    takePhoto,
  };
}
