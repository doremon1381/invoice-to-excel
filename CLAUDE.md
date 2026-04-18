# CLAUDE.md

## Project overview
- Goal: build a production-quality React Native Expo app that scans invoice images, extracts structured invoice data with the Anthropic Vision API, stores results locally in SQLite, and exports invoice data to Excel.
- Current repo state: Expo Router starter app on Expo SDK 54 with TypeScript strict mode already enabled.
- Treat `docs/invoice-scanner-agent-prompt.md` as the product spec.

## Source of truth
Before implementing substantial work in this repo, follow these project skills when relevant:
- `.claude/skills/coding-standards`
- `.claude/skills/react-native-expo-architecture`
- `.claude/skills/security-review` when handling API keys, external requests, file import/export, or user-provided data
- `.claude/skills/react-native-expo-code-review` for post-implementation review

## Product requirements
Implement an Expo mobile app with these core flows:
1. User captures an invoice photo or selects one from the gallery.
2. App compresses the image before base64 encoding.
3. App sends the image to Anthropic Messages API vision input.
4. App parses the JSON response into a strict invoice shape.
5. App persists invoice metadata, header fields, and line items in local SQLite.
6. App displays invoices in list and detail screens.
7. App exports either all invoices or a single invoice to `.xlsx` and opens the native share sheet.
8. User configures the Anthropic API key in Settings using Secure Store.

## Required stack
- Expo Router for navigation
- TypeScript strict mode, no `any`
- `expo-camera` and `expo-image-picker`
- `expo-image-manipulator` for compression (max width 1200, quality 0.8)
- `expo-sqlite` for local persistence
- `expo-secure-store` for API key storage
- Native `fetch` for Anthropic API calls
- `xlsx`, `expo-file-system`, and `expo-sharing` for export
- React Context + `useReducer` only if shared app state is truly needed
- Prefer React local state/hooks where global state is unnecessary

## Architecture guidance
Prefer a lightweight responsibility-based structure that fits the current app size:

```text
app/
  _layout.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    scan.tsx
    settings.tsx
  invoice/
    [id].tsx
components/
  InvoiceCard.tsx
  FinancialSummary.tsx
  LoadingOverlay.tsx
  ScanButton.tsx
  EmptyState.tsx
hooks/
  useInvoiceExport.ts
  useInvoiceScan.ts
  useStoredApiKey.ts
lib/
  anthropic.ts
  db.ts
  export.ts
  parser.ts
  types.ts
  constants.ts
```

### Responsibility boundaries
- Screens: orchestrate user flows, navigation, route params, permission prompts, and loading/error states.
- Components: focused presentational UI only.
- Hooks: encapsulate one stateful workflow each, such as scan flow, export flow, or API key persistence.
- `lib/db.ts`: schema creation plus CRUD helpers only.
- `lib/anthropic.ts`: API request construction and response extraction only.
- `lib/parser.ts`: JSON extraction, validation, normalization.
- `lib/export.ts`: workbook generation, file writing, and sharing.
- `lib/types.ts`: domain models and DTOs only.
- Keep Expo-specific I/O isolated in hooks/services instead of spreading it across screens.

## Database requirements
Create and initialize these tables on startup:
- `invoices`
- `invoice_data`
- `line_items`

Expect relationships:
- `invoice_data.invoice_id -> invoices.id`
- `line_items.invoice_id -> invoices.id`
- delete child rows when invoice is deleted

Add CRUD helpers for:
- initialize database
- insert invoice scan record
- insert invoice data and line items in one flow/transaction if available
- fetch all invoices for home list
- fetch one invoice with detail data
- fetch line items by invoice id
- delete invoice by id

## Anthropic integration requirements
- Use `https://api.anthropic.com/v1/messages`
- Use model `claude-sonnet-4-20250514`
- Send the exact extraction prompt from `docs/invoice-scanner-agent-prompt.md`
- Return only parsed structured JSON data
- Never hardcode API keys
- Read/store API key via Secure Store only
- Surface API failures as user-friendly errors

## UI requirements
### Home screen
- List invoices sorted by `scanned_at DESC`
- Show vendor, total, currency, invoice date, and status badge
- Tap card to open invoice detail
- Support delete with confirmation
- Add header action for `Export All`
- Disable export when there are no invoices
- Show empty state when the database is empty

### Scan screen
- Provide camera capture and gallery pick actions
- Show preview before or during extraction as appropriate
- Validate API key before scan submission
- Show visible loading state during extraction
- Persist successful scans, then navigate to detail screen
- Show retry path on failure

### Settings screen
- Save API key in Secure Store
- Mask key by default with show/hide toggle
- Provide connection test action

### Invoice detail screen
- Show invoice image thumbnail
- Show extracted header fields
- Show line items list/table
- Show financial summary
- Allow export of single invoice
- Allow delete with confirmation

## Error handling rules
- No silent failures
- Every async action must expose a loading state and a user-facing error state
- Wrap DB operations in try/catch and convert low-level errors into readable messages
- Fail fast on invalid or missing API key before starting scan
- Prefer explicit empty states over blank screens

## Security rules
- Never log or hardcode the Anthropic API key
- Keep secrets in Secure Store only
- Treat extracted invoice text/data as untrusted input; parse and validate before persistence
- Do not trust model output without JSON parsing and structural validation
- Avoid adding new remote services; this app is offline-first except the Anthropic API request

## Implementation order
Follow this sequence unless the user explicitly changes priorities:
1. Remove starter/demo screens and align routing structure.
2. Install required Expo and app dependencies.
3. Add shared domain types.
4. Implement SQLite schema and CRUD helpers.
5. Implement Anthropic client and parser.
6. Implement export service.
7. Build Settings screen and API key persistence.
8. Build Scan flow.
9. Build Home list and delete/export-all actions.
10. Build Invoice detail screen and single-export action.
11. Polish loading, errors, empty states, and confirmation UX.
12. Run lint/type checks and test on Android/iOS.

## Definition of done
A task is not complete unless:
- TypeScript strict mode passes with no `any`
- Lint passes
- Starter placeholders removed or replaced in touched areas
- All core screens are wired through Expo Router
- SQLite initialization happens at app startup
- Export works through native sharing flow
- Errors and loading states are visible in every async path
- README is updated with setup, API key configuration, and run instructions

## Notes for future agents
- This repo currently still contains the Expo starter template; replace it incrementally rather than layering invoice logic on top of the demo UI.
- Keep abstractions small. Do not introduce broad service/controller architectures beyond what this app needs.
- When referencing the extraction prompt, copy it exactly from `docs/invoice-scanner-agent-prompt.md` instead of paraphrasing.
