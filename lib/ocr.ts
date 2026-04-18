import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { IMAGE_COMPRESS_QUALITY, IMAGE_MAX_WIDTH } from '@/lib/constants';

export interface OCRLine {
  text: string;
  confidence: number;
  bbox: number[][];
}

export interface OCRResult {
  full_text: string;
  lines: OCRLine[];
  total_lines: number;
}

async function compressImage(imageUri: string): Promise<string> {
  const compressed = await manipulateAsync(
    imageUri,
    [{ resize: { width: IMAGE_MAX_WIDTH } }],
    {
      compress: IMAGE_COMPRESS_QUALITY,
      format: SaveFormat.JPEG,
    },
  );

  return compressed.uri;
}

export async function runPaddleOCR(imageUri: string, serverUrl: string): Promise<OCRResult> {
  const compressedUri = await compressImage(imageUri);
  const response = await FileSystem.uploadAsync(`${serverUrl}/ocr`, compressedUri, {
    fieldName: 'file',
    headers: {
      Accept: 'application/json',
    },
    httpMethod: 'POST',
    mimeType: 'image/jpeg',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
  });

  if (response.status !== 200) {
    throw new Error(`OCR server returned ${response.status}: ${response.body}`);
  }

  return JSON.parse(response.body) as OCRResult;
}

export async function checkOCRServerHealth(serverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/health`, { method: 'GET' });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as { status?: string };
    return data.status === 'ok';
  } catch {
    return false;
  }
}
