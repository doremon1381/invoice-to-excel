# Scan View Redesign

## Goal
Adapt `app/(tabs)/scan.tsx` to match the immersive scanner direction in `docs/scan_design.png` while preserving the current PaddleOCR Docker workflow already implemented in the app.

## Current implementation
The current scan screen is a form-style page with:
- title + explanatory copy
- `Take Photo` button
- `Choose from Gallery` button
- preview card
- OCR setup information card
- error card
- generic loading overlay

This works functionally, but it does not match the new visual direction.

## Target design from `docs/scan_design.png`
The mock suggests a dark, focused, real-time OCR surface with three primary zones:

### 1. Top overlay controls
- dismiss/back affordance on the left
- centered processing label like `TRANSLATING...`
- settings shortcut on the right

### 2. Main scan stage
- large central framed invoice preview
- dark immersive background
- preview should feel like a live scanner surface even if the implementation still uses camera/gallery actions underneath

### 3. OCR overlay card
- floating structured-output panel over the preview area
- should display a compact OCR summary from real app data, not fake content
- suggested fields:
  - vendor
  - invoice date
  - total
  - OCR/extraction status
- if structured values are missing, show a shortened raw OCR snippet instead

### 4. Bottom action row
- left: gallery/import action, styled as a small thumbnail/source control
- center: large circular capture action mapped to `takePhoto`
- right: retry/refresh/clear action depending on current state

## Product mapping to the current app
This redesign is visual-first. The implementation should preserve the current scan logic:
- `takePhoto()` still drives camera capture
- `pickFromLibrary()` still drives gallery import
- `runPaddleOCR()` still uploads the selected image to the Docker OCR server
- successful scan still persists to SQLite and navigates to invoice detail

## Recommended implementation approach
### Keep changes mostly inside `app/(tabs)/scan.tsx`
The redesign can be implemented primarily in the scan screen itself.

### Reuse existing hook state
Continue using `useInvoiceScan()` for:
- `takePhoto`
- `pickFromLibrary`
- `previewUri`
- `isLoading`
- `error`
- `setError`

If needed, extend the hook only slightly to expose small transient OCR summary data for the overlay card.

### Dark-first treatment
The mock is dark mode. The redesigned scan screen should intentionally feel dark and immersive.
Use the existing semantic palette from `constants/theme.ts`, leaning especially on dark-mode tokens:
- `Colors.dark.background`
- `Colors.dark.card`
- `Colors.dark.border`
- `Colors.dark.text`
- `Colors.dark.muted`

### OCR loading state adaptation
Replace the generic full-screen loading feel with a more embedded OCR-reading experience:
- top status label while processing
- floating OCR panel over preview
- keep actual blocking behavior if necessary, but visually align it to the mock

### Error handling
Do not remove the current error flow.
Instead, integrate it into the immersive screen:
- show a compact inline error card or bottom panel
- provide clear recovery action

## Expected file impact
Primary files:
- `app/(tabs)/scan.tsx`
- `hooks/scan/useInvoiceScan.ts` (only if small extra scan-state exposure is needed)
- `components/scan/LoadingOverlay.tsx` (optional restyle or reduced use)

## Verification plan
After implementation:
- run lint
- run TypeScript check
- verify camera action still works
- verify gallery action still works
- verify preview is shown in the new layout
- verify OCR loading state is visible and understandable
- verify OCR errors remain actionable
- verify successful scan still navigates to invoice detail
- verify scan view remains usable on dark-themed surfaces
