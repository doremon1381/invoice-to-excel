# AI Agent Prompt: React Native Expo Invoice Scanner App

## Context for the Agent
You are a senior React Native developer. Your task is to build a production-quality
Expo mobile app that scans invoice images, extracts structured financial data using
the Anthropic Vision API, and persists results into a local SQLite database.

Before writing any code, read and follow ALL relevant skills from `.claude/skills/`.
These skills are your source of truth for coding conventions, architecture patterns,
and best practices used in this project.

---

## Skill Loading Instructions

1. List all skills available:
   ```
   ls .claude/skills/
   ```
2. Read each relevant SKILL.md before proceeding:
   ```
   cat .claude/skills/<skill-name>/SKILL.md
   ```
3. Fully comply with the conventions, patterns, and constraints defined in each skill.
   Do NOT deviate unless a skill explicitly allows it.

---

## Project Goal

Build a React Native Expo app with the following core capability:
> **User takes a photo (or picks from gallery) of a paper/PDF invoice →
> App extracts structured financial data via AI vision →
> Data is stored in SQLite and displayed in a clean UI.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK (latest stable) |
| Language | TypeScript (strict mode) |
| Navigation | Expo Router (file-based) |
| Camera | `expo-camera` + `expo-image-picker` |
| AI Vision | Anthropic Claude API (`claude-sonnet-4-20250514`) via `fetch` |
| Database | `expo-sqlite` (SQLite, local) |
| State | React Context + `useReducer` (no external state lib unless skill requires) |
| Styling | StyleSheet API (or NativeWind if skill specifies) |
| Storage | `expo-secure-store` for API key storage |
| Excel Export | `xlsx` (SheetJS) + `expo-file-system` + `expo-sharing` |

---

## App Architecture

```
app/
├── (tabs)/
│   ├── index.tsx          # Home: recent invoices list
│   ├── scan.tsx           # Camera / image picker screen
│   └── settings.tsx       # API key config
├── invoice/
│   └── [id].tsx           # Invoice detail screen
├── _layout.tsx            # Root layout + DB init
components/
├── InvoiceCard.tsx
├── FinancialSummary.tsx
├── ScanButton.tsx
└── LoadingOverlay.tsx
lib/
├── db.ts                  # SQLite schema + CRUD helpers
├── anthropic.ts           # Vision API call + prompt
├── parser.ts              # JSON extraction from AI response
├── export.ts              # Excel export logic (SheetJS + expo-file-system)
└── types.ts               # Shared TypeScript interfaces
```

---

## Database Schema (SQLite via expo-sqlite)

Create the following tables on app startup inside `lib/db.ts`:

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  image_uri   TEXT NOT NULL,
  raw_text    TEXT,
  scanned_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  status      TEXT DEFAULT 'pending'   -- 'pending' | 'success' | 'error'
);

CREATE TABLE IF NOT EXISTS invoice_data (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id      INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  vendor_name     TEXT,
  vendor_address  TEXT,
  invoice_number  TEXT,
  invoice_date    TEXT,
  due_date        TEXT,
  subtotal        REAL,
  tax_amount      REAL,
  discount_amount REAL,
  total_amount    REAL,
  currency        TEXT DEFAULT 'VND',
  payment_method  TEXT,
  notes           TEXT
);

CREATE TABLE IF NOT EXISTS line_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id    INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description   TEXT,
  quantity      REAL,
  unit_price    REAL,
  unit          TEXT,
  total_price   REAL
);
```

---

## AI Vision Integration (`lib/anthropic.ts`)

Call the Anthropic API with the invoice image encoded as base64.

### Extraction Prompt (use exactly):

```
You are a financial data extraction specialist. Analyze this invoice image and extract all financial information.

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "vendor_name": string | null,
  "vendor_address": string | null,
  "invoice_number": string | null,
  "invoice_date": string | null,
  "due_date": string | null,
  "subtotal": number | null,
  "tax_amount": number | null,
  "discount_amount": number | null,
  "total_amount": number | null,
  "currency": string,
  "payment_method": string | null,
  "notes": string | null,
  "line_items": [
    {
      "description": string,
      "quantity": number | null,
      "unit": string | null,
      "unit_price": number | null,
      "total_price": number | null
    }
  ]
}

Rules:
- All monetary values must be plain numbers (no currency symbols, no commas)
- Dates must be in ISO 8601 format (YYYY-MM-DD) if possible
- If a field is not found, use null
- The invoice may be in Vietnamese — translate field values to English where appropriate
- currency should be the 3-letter ISO code (e.g. VND, USD, EUR)
```

### API Call Implementation:

```typescript
// lib/anthropic.ts
export async function extractInvoiceData(
  imageBase64: string,
  mimeType: string,
  apiKey: string
): Promise<ExtractedInvoice> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,   // 'image/jpeg' | 'image/png'
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,  // the prompt above
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '';
  return parseExtractedJSON(text);  // implemented in lib/parser.ts
}
```

---

## Excel Export Feature (`lib/export.ts`)

### Dependencies
```bash
npm install xlsx
npx expo install expo-file-system expo-sharing
```

### Two Export Modes

**1. Export All Invoices** — one row per invoice, summary-level data.
**2. Export Single Invoice** — two sheets: invoice header + line items breakdown.

### Implementation:

```typescript
// lib/export.ts
import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllInvoicesWithData, getInvoiceById, getLineItems } from './db';

// --- Export ALL invoices (summary sheet) ---
export async function exportAllInvoicesToExcel(): Promise<void> {
  const invoices = await getAllInvoicesWithData();

  const summaryRows = invoices.map(inv => ({
    'Invoice No.':    inv.invoice_number ?? '—',
    'Vendor':         inv.vendor_name ?? '—',
    'Invoice Date':   inv.invoice_date ?? '—',
    'Due Date':       inv.due_date ?? '—',
    'Subtotal':       inv.subtotal ?? 0,
    'Tax':            inv.tax_amount ?? 0,
    'Discount':       inv.discount_amount ?? 0,
    'Total':          inv.total_amount ?? 0,
    'Currency':       inv.currency ?? 'VND',
    'Payment Method': inv.payment_method ?? '—',
    'Scanned At':     inv.scanned_at,
    'Notes':          inv.notes ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(summaryRows);

  // Auto column widths
  ws['!cols'] = Object.keys(summaryRows[0] ?? {}).map(() => ({ wch: 20 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');

  await writeAndShare(wb, `invoices_export_${dateStamp()}.xlsx`);
}

// --- Export SINGLE invoice (header + line items) ---
export async function exportSingleInvoiceToExcel(invoiceId: number): Promise<void> {
  const inv = await getInvoiceById(invoiceId);
  const items = await getLineItems(invoiceId);

  // Sheet 1: Invoice header
  const headerRows = [
    { Field: 'Invoice No.',    Value: inv.invoice_number },
    { Field: 'Vendor',         Value: inv.vendor_name },
    { Field: 'Vendor Address', Value: inv.vendor_address },
    { Field: 'Invoice Date',   Value: inv.invoice_date },
    { Field: 'Due Date',       Value: inv.due_date },
    { Field: 'Subtotal',       Value: inv.subtotal },
    { Field: 'Tax',            Value: inv.tax_amount },
    { Field: 'Discount',       Value: inv.discount_amount },
    { Field: 'Total',          Value: inv.total_amount },
    { Field: 'Currency',       Value: inv.currency },
    { Field: 'Payment Method', Value: inv.payment_method },
    { Field: 'Notes',          Value: inv.notes },
  ];

  // Sheet 2: Line items
  const lineRows = items.map(item => ({
    'Description': item.description,
    'Quantity':    item.quantity,
    'Unit':        item.unit,
    'Unit Price':  item.unit_price,
    'Total Price': item.total_price,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(headerRows), 'Invoice');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lineRows),   'Line Items');

  const filename = `invoice_${inv.invoice_number ?? invoiceId}_${dateStamp()}.xlsx`;
  await writeAndShare(wb, filename);
}

// --- Shared helper ---
async function writeAndShare(wb: XLSX.WorkBook, filename: string): Promise<void> {
  const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const fileUri = FileSystem.documentDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device');

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Export Invoice',
    UTI: 'com.microsoft.excel.xlsx',
  });
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
```

### Where to Add Export UI

- **Home Screen** (`app/(tabs)/index.tsx`): Add an "Export All" button in the header toolbar. On press, call `exportAllInvoicesToExcel()` with a loading indicator.
- **Invoice Detail Screen** (`app/invoice/[id].tsx`): Add an "Export" icon button in the top-right header. On press, call `exportSingleInvoiceToExcel(id)`.
- Both buttons must show a loading spinner while exporting and display a user-friendly error toast on failure.

---

## Key Screens

### 1. Scan Screen (`app/(tabs)/scan.tsx`)
- Button: "Take Photo" → opens camera
- Button: "Choose from Gallery" → opens image picker
- After image selected:
  1. Show image preview
  2. Show loading spinner ("Extracting invoice data…")
  3. Call `extractInvoiceData()`
  4. Save result to SQLite via `lib/db.ts`
  5. Navigate to `app/invoice/[id].tsx`
- Handle errors gracefully with a retry button

### 2. Home Screen (`app/(tabs)/index.tsx`)
- FlatList of all invoices sorted by `scanned_at DESC`
- Each card shows: vendor name, total amount, currency, date, status badge
- Tap → navigate to detail screen
- Swipe-to-delete with confirmation
- **"Export All" button** in header toolbar → calls `exportAllInvoicesToExcel()`, shows loading spinner, disabled when list is empty

### 3. Invoice Detail Screen (`app/invoice/[id].tsx`)
- Show scanned image thumbnail
- Display all extracted fields in a readable layout
- Line items table with columns: Description, Qty, Unit Price, Total
- Financial summary footer: Subtotal / Tax / Discount / **Total**
- **"Export" icon button** in top-right header → calls `exportSingleInvoiceToExcel(id)`, exports two-sheet .xlsx (header + line items)
- "Delete" button with confirmation

### 4. Settings Screen (`app/(tabs)/settings.tsx`)
- Input for Anthropic API key (stored via `expo-secure-store`)
- API key masked by default, show/hide toggle
- "Test Connection" button that sends a minimal API request

---

## Requirements & Constraints

### Must Have
- [ ] TypeScript strict mode, zero `any` types
- [ ] Error boundaries on every screen
- [ ] Loading states for all async operations
- [ ] Empty state UI when no invoices exist
- [ ] API key validation before allowing scan
- [ ] Image compressed before base64 encoding (`expo-image-manipulator`, max 1200px wide, quality 0.8)
- [ ] All DB operations wrapped in try/catch with user-facing error messages
- [ ] Works offline (SQLite local only; only API call needs internet)
- [ ] Excel export works on both iOS and Android via native share sheet
- [ ] "Export All" button disabled and shows tooltip when invoice list is empty
- [ ] Exported `.xlsx` filename includes date stamp (e.g. `invoices_export_2026-04-18.xlsx`)

### Must NOT
- [ ] Never hardcode API keys — always use `expo-secure-store`
- [ ] Never block the UI thread with heavy operations
- [ ] Never crash silently — all errors must surface to the user

### Nice to Have (implement if time allows)
- [ ] Search/filter by vendor or date range
- [ ] Total spending summary dashboard on Home screen
- [ ] Dark mode support
- [ ] Export selected invoices only (multi-select mode)

---

## Implementation Order

Follow this sequence strictly:

1. **Initialize project**: `npx create-expo-app@latest invoice-scanner --template blank-typescript`
2. **Install dependencies** (expo-camera, expo-image-picker, expo-sqlite, expo-secure-store, expo-image-manipulator, expo-router, expo-file-system, expo-sharing, xlsx)
3. **Set up Expo Router** file structure
4. **Implement `lib/db.ts`** — schema creation, CRUD, run migrations on app start
5. **Implement `lib/anthropic.ts`** — API call with exact prompt above
6. **Implement `lib/parser.ts`** — JSON parsing with validation
7. **Implement `lib/export.ts`** — `exportAllInvoicesToExcel` and `exportSingleInvoiceToExcel`
8. **Implement `lib/types.ts`** — all shared interfaces
9. **Build Settings screen** — API key storage/retrieval
10. **Build Scan screen** — camera + image picker + AI call flow
11. **Build Home screen** — invoice list with delete + Export All button
12. **Build Detail screen** — full invoice view + Export button
13. **Polish** — loading states, error handling, empty states
14. **Test on both iOS and Android simulators**

---

## Output Expected from Agent

At the end of implementation, provide:

1. All source files in the correct directory structure
2. A `README.md` with:
   - Setup instructions
   - How to obtain and configure an Anthropic API key
   - How to run on iOS and Android
3. A brief summary of any deviations from this spec and why

---

*Read `.claude/skills/` before starting. Follow every skill convention found there.*
