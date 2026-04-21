import * as FileSystem from 'expo-file-system/legacy';
import { CameraView } from 'expo-camera';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerAsset, MediaTypeOptions } from 'expo-image-picker';
import { useCallback, useState, type RefObject } from 'react';

import { extractInvoiceData } from '@/lib/openai';
import { IMAGE_COMPRESS_QUALITY, IMAGE_MAX_WIDTH, OPENAI_API_KEY } from '@/lib/constants';
import { saveInvoice } from '@/lib/db';
import type { ExtractedInvoice, InvoiceStatus } from '@/lib/types';

async function prepareImage(asset: ImagePickerAsset): Promise<{ uri: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; base64: string }> {
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
    mimeType: asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
    base64,
  };
}

function deriveStatus(extracted: ExtractedInvoice): InvoiceStatus {
  const score = [
    extracted.vendor_name,
    extracted.invoice_number,
    extracted.invoice_date,
    extracted.total_amount,
  ].filter((value) => value !== null).length;

  return score >= 2 ? 'success' : 'pending';
}

function deriveRawText(extracted: ExtractedInvoice, rawText: string): string {
  return rawText.trim() || extracted.notes?.trim() || '';
}

export interface ScanPreviewData {
  extracted: ExtractedInvoice;
  rawText: string;
  status: InvoiceStatus;
}

interface ScanResult {
  invoiceId: number;
  imageUri: string;
}

function toPreviewData(extracted: ExtractedInvoice, rawText: string, status: InvoiceStatus): ScanPreviewData {
  return {
    extracted,
    rawText: deriveRawText(extracted, rawText),
    status,
  };
}

function cameraPictureToAsset(picture: { uri: string; width: number; height: number }): ImagePickerAsset {
  return {
    uri: picture.uri,
    width: picture.width,
    height: picture.height,
    type: 'image',
    mimeType: 'image/jpeg',
  };
}

function getTestingApiKey(): string {
  return OPENAI_API_KEY;
}

export function useInvoiceScan() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<ScanPreviewData | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const processAsset = useCallback(async (asset: ImagePickerAsset): Promise<ScanResult> => {
    const apiKey = getTestingApiKey();

    if (!apiKey) {
      throw new Error('OpenAI test API key is not configured.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const preparedImage = await prepareImage(asset);
      setPreviewUri(preparedImage.uri);

      //Alert.alert('debug - preparedImage', preparedImage.toString());
      const { extracted, rawText } = await extractInvoiceData(preparedImage.base64, preparedImage.mimeType);

      //Alert.alert('debug - extracted', extracted.toString());
      //Alert.alert('debug - rawText', rawText.toString());

      const status = deriveStatus(extracted);
      setPreviewData(toPreviewData(extracted, rawText, status));

      const invoiceId = await saveInvoice({
        imageUri: preparedImage.uri,
        rawText: deriveRawText(extracted, rawText),
        status,
        extracted,
      });

      return {
        invoiceId,
        imageUri: preparedImage.uri,
      };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Failed to scan invoice.';
      setPreviewData(null);
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

  const captureFromCamera = useCallback(
    async (cameraRef: RefObject<InstanceType<typeof CameraView> | null>): Promise<ScanResult | null> => {
      const camera = cameraRef.current;

      if (!camera) {
        throw new Error('Camera is not ready yet.');
      }

      const picture = await camera.takePictureAsync({ quality: 1, skipProcessing: false });
      const asset = cameraPictureToAsset(picture);

      return processAsset(asset);
    },
    [processAsset],
  );

  const clearScanPreview = useCallback(() => {
    setPreviewUri(null);
    setPreviewData(null);
    setError(null);
  }, []);

  return {
    captureFromCamera,
    clearScanPreview,
    error,
    isLoading,
    pickFromLibrary,
    previewData,
    previewUri,
    setError,
    takePhoto,
  };
}
