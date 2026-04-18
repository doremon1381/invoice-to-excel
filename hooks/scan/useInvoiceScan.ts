import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerAsset, MediaTypeOptions } from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import { extractInvoiceData } from '@/lib/anthropic';
import { IMAGE_COMPRESS_QUALITY, IMAGE_MAX_WIDTH } from '@/lib/constants';
import { saveInvoice } from '@/lib/db';

interface ScanResult {
  invoiceId: number;
  imageUri: string;
}

function getMimeType(asset: ImagePickerAsset): string {
  if (asset.mimeType === 'image/png') {
    return 'image/png';
  }

  return 'image/jpeg';
}

async function prepareImage(asset: ImagePickerAsset): Promise<{ uri: string; mimeType: string; base64: string }> {
  const manipulated = await manipulateAsync(
    asset.uri,
    [{ resize: { width: IMAGE_MAX_WIDTH } }],
    {
      compress: IMAGE_COMPRESS_QUALITY,
      format: SaveFormat.JPEG,
      base64: false,
    },
  );

  const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    uri: manipulated.uri,
    mimeType: getMimeType(asset),
    base64,
  };
}

export function useInvoiceScan() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const processAsset = useCallback(async (asset: ImagePickerAsset, apiKey: string): Promise<ScanResult> => {
    if (!apiKey.trim()) {
      throw new Error('Please save your Anthropic API key before scanning.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const preparedImage = await prepareImage(asset);
      setPreviewUri(preparedImage.uri);

      const { extracted, rawText } = await extractInvoiceData(preparedImage.base64, preparedImage.mimeType, apiKey);
      const invoiceId = await saveInvoice({
        imageUri: preparedImage.uri,
        rawText,
        status: 'success',
        extracted,
      });

      return {
        invoiceId,
        imageUri: preparedImage.uri,
      };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to scan invoice.';
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickFromLibrary = useCallback(async (apiKey: string) => {
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

    return processAsset(result.assets[0], apiKey);
  }, [processAsset]);

  const takePhoto = useCallback(async (apiKey: string) => {
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

    return processAsset(result.assets[0], apiKey);
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
