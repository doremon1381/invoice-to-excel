import * as FileSystem from 'expo-file-system/legacy';
import { CameraView } from 'expo-camera';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { ImagePickerAsset, MediaTypeOptions } from 'expo-image-picker';
import { useCallback, useState, type RefObject } from 'react';

import { IMAGE_COMPRESS_QUALITY, IMAGE_MAX_WIDTH, OPENAI_API_KEY } from '@/lib/constants';
import { i18n } from '@/lib/i18n';
import { extractInvoiceData } from '@/lib/openai';
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

export interface ScanResult {
  invoiceName: string | null;
  imageUri: string;
  imageBase64: string;
  imageMime: 'image/jpeg' | 'image/png' | 'image/webp';
  extracted: ExtractedInvoice;
  rawText: string;
  status: InvoiceStatus;
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
      throw new Error(i18n.t('scan.errorNoApiKey'));
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
      const normalizedRawText = deriveRawText(extracted, rawText);
      setPreviewData(toPreviewData(extracted, rawText, status));

      return {
        invoiceName: null,
        imageUri: preparedImage.uri,
        imageBase64: preparedImage.base64,
        imageMime: preparedImage.mimeType,
        extracted,
        rawText: normalizedRawText,
        status,
      };
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : i18n.t('scan.errorGenericScan');
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
      throw new Error(i18n.t('scan.errorPhotoPermission'));
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
      throw new Error(i18n.t('scan.errorCameraPermission'));
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
        throw new Error(i18n.t('scan.errorCameraNotReady'));
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
