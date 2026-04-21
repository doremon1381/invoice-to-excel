Here's a complete guide to calling your Docker PaddleOCR server from a React Native Expo app.

---

## Step 1 — Install Dependencies

```bash
npx expo install expo-file-system expo-image-manipulator
```

---

## Step 2 — Create `lib/ocr.ts`

```typescript
// lib/ocr.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

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

// ── compress image before upload ──────────────────────────────────────────────
async function compressImage(imageUri: string): Promise<string> {
  const compressed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return compressed.uri;
}

// ── main OCR call ─────────────────────────────────────────────────────────────
export async function runPaddleOCR(
  imageUri: string,
  serverUrl: string         // e.g. "http://192.168.1.42:8000"
): Promise<OCRResult> {
  // 1. Compress first
  const compressedUri = await compressImage(imageUri);

  // 2. Upload via expo-file-system (handles file:// URIs correctly on both platforms)
  const response = await FileSystem.uploadAsync(
    `${serverUrl}/ocr`,
    compressedUri,
    {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: 'image/jpeg',
      headers: {
        Accept: 'application/json',
      },
    }
  );

  if (response.status !== 200) {
    throw new Error(`OCR server returned ${response.status}: ${response.body}`);
  }

  return JSON.parse(response.body) as OCRResult;
}

// ── health check (use in Settings screen) ────────────────────────────────────
export async function checkOCRServerHealth(serverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),   // 5s timeout
    });
    const data = await response.json();
    return data?.status === 'ok';
  } catch {
    return false;
  }
}
```

> **Why `FileSystem.uploadAsync` instead of `fetch`?**
> React Native's `fetch` with `FormData` has known bugs with `file://` URIs on Android — it silently sends an empty file. `expo-file-system`'s `uploadAsync` handles this correctly on both platforms.

---

## Step 3 — Store Server URL in Settings

Add server URL storage alongside your existing API key in `lib/storage.ts`:

```typescript
// lib/storage.ts
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  ANTHROPIC_API_KEY: 'anthropic_api_key',
  OCR_SERVER_URL:    'ocr_server_url',
};

export const Storage = {
  async getAnthropicKey(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.ANTHROPIC_API_KEY);
  },
  async setAnthropicKey(key: string): Promise<void> {
    return SecureStore.setItemAsync(KEYS.ANTHROPIC_API_KEY, key);
  },
  async getOCRServerUrl(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.OCR_SERVER_URL);
  },
  async setOCRServerUrl(url: string): Promise<void> {
    return SecureStore.setItemAsync(KEYS.OCR_SERVER_URL, url.replace(/\/$/, ''));
  },
};
```

---

## Step 4 — Settings Screen Addition

Add this to your existing `app/(tabs)/settings.tsx`:

```tsx
// Inside your Settings screen component
const [ocrUrl, setOcrUrl] = useState('');
const [ocrStatus, setOcrStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');

useEffect(() => {
  Storage.getOCRServerUrl().then(url => { if (url) setOcrUrl(url); });
}, []);

async function saveOCRUrl() {
  await Storage.setOCRServerUrl(ocrUrl.trim());
  Alert.alert('Saved', 'OCR server URL saved.');
}

async function testOCRConnection() {
  setOcrStatus('checking');
  const ok = await checkOCRServerHealth(ocrUrl.trim());
  setOcrStatus(ok ? 'ok' : 'error');
}

// JSX to add in your settings form:
<Text style={styles.label}>PaddleOCR Server URL</Text>
<TextInput
  style={styles.input}
  value={ocrUrl}
  onChangeText={setOcrUrl}
  placeholder="http://192.168.1.42:8000"
  autoCapitalize="none"
  keyboardType="url"
/>
<View style={styles.row}>
  <Button title="Save" onPress={saveOCRUrl} />
  <Button title="Test Connection" onPress={testOCRConnection} />
</View>
{ocrStatus === 'checking' && <ActivityIndicator />}
{ocrStatus === 'ok'       && <Text style={styles.success}>✓ Server reachable</Text>}
{ocrStatus === 'error'    && <Text style={styles.error}>✗ Cannot reach server</Text>}
```

---

## Step 5 — Wire It Into the Scan Flow

Update your scan screen to use the two-step pipeline:

```tsx
// app/(tabs)/scan.tsx  — core scanning logic

import { runPaddleOCR } from '@/lib/ocr';
import { extractFromOCRText } from '@/lib/anthropic';
import { Storage } from '@/lib/storage';
import { saveInvoice } from '@/lib/db';

type ScanStep =
  | 'idle'
  | 'compressing'
  | 'ocr'           // calling PaddleOCR
  | 'extracting'    // calling Anthropic
  | 'saving'
  | 'done'
  | 'error';

export default function ScanScreen() {
  const router = useRouter();
  const [imageUri, setImageUri]   = useState<string | null>(null);
  const [step, setStep]           = useState<ScanStep>('idle');
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  async function processImage(uri: string) {
    setImageUri(uri);
    setErrorMsg(null);

    try {
      const [apiKey, ocrUrl] = await Promise.all([
        Storage.getAnthropicKey(),
        Storage.getOCRServerUrl(),
      ]);

      if (!apiKey) {
        setErrorMsg('Anthropic API key not set. Go to Settings.');
        return;
      }
      if (!ocrUrl) {
        setErrorMsg('OCR server URL not set. Go to Settings.');
        return;
      }

      // Step 1 — OCR
      setStep('ocr');
      const ocrResult = await runPaddleOCR(uri, ocrUrl);

      if (!ocrResult.full_text.trim()) {
        throw new Error('No text found in the image. Try a clearer photo.');
      }

      // Step 2 — Anthropic extraction
      setStep('extracting');
      const invoiceData = await extractFromOCRText(ocrResult.full_text, apiKey);

      // Step 3 — Save to SQLite
      setStep('saving');
      const id = await saveInvoice(uri, ocrResult.full_text, invoiceData);

      setStep('done');
      router.push(`/invoice/${id}`);

    } catch (err) {
      setStep('error');
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error occurred.');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const STEP_LABELS: Record<ScanStep, string> = {
    idle:       '',
    compressing:'Compressing image…',
    ocr:        'Reading invoice text (OCR)…',
    extracting: 'Extracting financial data…',
    saving:     'Saving to database…',
    done:       'Done!',
    error:      'Something went wrong.',
  };

  const isProcessing = ['compressing','ocr','extracting','saving'].includes(step);

  return (
    <View style={styles.container}>
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      )}

      {isProcessing && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>{STEP_LABELS[step]}</Text>
        </View>
      )}

      {step === 'error' && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Button title="Try Again" onPress={() => setStep('idle')} />
        </View>
      )}

      {!isProcessing && step !== 'done' && (
        <View style={styles.buttonRow}>
          <Button title="📷  Take Photo"         onPress={() => pickFromCamera(processImage)} />
          <Button title="🖼️  Choose from Gallery" onPress={() => pickFromGallery(processImage)} />
        </View>
      )}
    </View>
  );
}
```

---

## Step 6 — Network Permission (Android)

If targeting Android, add this to `app.json` to allow plain HTTP to your local server:

```json
{
  "expo": {
    "android": {
      "usesCleartextTraffic": true
    }
  }
}
```

> This is safe for development. For production, put your OCR server behind HTTPS and remove this flag.

---

## Full Data Flow Summary

```
User picks image
      ↓
expo-image-manipulator  →  compress to max 1200px / 80% quality
      ↓
FileSystem.uploadAsync  →  POST multipart to Docker container (port 8000)
      ↓
PaddleOCR (Vietnamese)  →  { full_text, lines, total_lines }
      ↓
Anthropic Claude API    →  structured JSON (vendor, totals, line items)
      ↓
expo-sqlite             →  saved to invoices + invoice_data + line_items
      ↓
Invoice Detail Screen   →  display + export to Excel
```

---

## Common Issues

| Problem | Cause | Fix |
|---|---|---|
| `Network request failed` on Android | HTTP blocked by default | Add `usesCleartextTraffic: true` to `app.json` |
| Empty OCR result | Image too small or blurry | Increase max resize width to 1600px |
| `Connection refused` | Wrong IP or container not running | Run `docker ps` and re-check LAN IP |
| Timeout on first request | Model warming up | Add a longer timeout (15s) for first call |
| Works on simulator, fails on device | Using `localhost` | Always use LAN IP on physical devices |