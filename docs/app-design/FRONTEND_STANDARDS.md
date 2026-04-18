# Invoice Scanner Frontend Standards

Updated: 2026-04-18

This document defines the frontend standards for the current `invoice-to-excel-expo` app. It replaces older guidance that prescribed a different styling stack or unrelated app architecture.

## 1. Purpose

Goals:

1. Keep the invoice scanner UI consistent across screens.
2. Keep route files focused on flow orchestration.
3. Keep non-UI logic in hooks and `lib/` modules.
4. Keep theming dark-mode safe while using NativeWind as the primary styling layer.
5. Make async loading, empty, and error states explicit.
6. Preserve the current product workflows while the UI system evolves.

Current stack:

- Expo Router
- React Native + React 19
- Expo SDK 54
- TypeScript strict mode
- NativeWind + Tailwind config
- semantic theme values in `constants/theme.ts`
- compatibility theme helpers in `hooks/theme/*` and `components/shared/themed-*`
- SQLite, Secure Store, image picker/camera, Anthropic API, Excel export

## 2. Folder Responsibilities

Use the current repo structure:

```text
app/                      Route files only
  _layout.tsx
  (tabs)/
  invoice/
components/
  invoice/                Invoice list/detail presentational UI
  scan/                   Scan flow UI
  shared/                 Reused generic and theme-aware UI
    ui/                   Small primitives like icons
hooks/
  invoice/                Invoice-specific workflows
  scan/                   Scan/import workflow
  settings/               API key persistence workflow
  theme/                  Theme helpers
lib/                      Non-UI logic: db, api, parser, export, domain types/constants
constants/                Semantic theme values
```

Rules:

1. Route files stay in `app/`.
2. Reusable UI belongs in `components/`.
3. Stateful workflows belong in `hooks/`.
4. Database, API, parsing, and export logic belong in `lib/`.
5. Do not introduce broader layers like `screen/`, `services/`, `contexts/`, or Zustand unless the app genuinely grows to require them.

## 3. Naming and File Conventions

Rules:

1. Components use `PascalCase` filenames.
2. Hooks use `camelCase` and start with `use`.
3. Keep import paths feature-grouped once related files reach more than one item.
4. Do not rename established files casually if a move does not improve clarity.

Examples:

- `components/invoice/InvoiceCard.tsx`
- `components/scan/LoadingOverlay.tsx`
- `components/shared/themed-text.tsx`
- `hooks/scan/useInvoiceScan.ts`
- `hooks/settings/useStoredApiKey.ts`

## 4. State Ownership

Use the narrowest owner possible.

### Local component state

Use `useState` for:

- input values
- loading flags local to one screen/hook
- local feedback messages
- temporary UI state such as show/hide toggles

### Hooks

Use hooks for one workflow each:

- `useInvoiceScan` for image selection, image preparation, extraction, and persistence
- `useInvoiceExport` for export-all and export-single lifecycle state
- `useStoredApiKey` for Secure Store persistence

Do not move these workflows back into route files.

## 5. Data and Side Effect Placement

Keep responsibilities split like this:

- `app/`
  - navigation
  - screen-level composition
  - route params
  - confirmation dialogs
- `components/`
  - presentational rendering
- `hooks/`
  - stateful workflows and async lifecycle state
- `lib/`
  - SQLite helpers
  - Anthropic request construction
  - AI response parsing/normalization
  - Excel generation and sharing
  - shared domain types/constants

Rules:

1. Screens should not build SQL or Anthropic payloads inline.
2. Components should not talk to Secure Store, SQLite, or remote APIs directly.
3. `lib/` files must remain React-free.
4. If formatting logic repeats meaningfully, extract a small pure helper instead of duplicating it.

## 6. Styling System

This repo is now NativeWind-first.

### Default rule

Use:

- `className` on React Native components for layout, spacing, sizing, radius, and basic composition
- `global.css` as the Tailwind entry file
- `tailwind.config.js` for shared tokens
- `babel.config.js` and `metro.config.js` for NativeWind integration

Example:

```tsx
<View className="rounded-3xl border p-5" />
```

### Theme-driven values

Use runtime style objects only where they remain the clearest choice, such as:

- values that depend on `useColorScheme()` and `Colors`
- pressed-state opacity
- `ActivityIndicator` color
- semantic borders/backgrounds that still come from `constants/theme.ts`
- image and overlay styling where NativeWind alone is not enough

Example:

```tsx
const colorScheme = useColorScheme() ?? 'light';
const colors = Colors[colorScheme];

<View className="rounded-3xl border p-5" style={{ backgroundColor: colors.card, borderColor: colors.border }} />
```

### Migration rules

1. New or heavily touched UI should default to NativeWind.
2. Existing `StyleSheet.create` code can coexist temporarily in untouched areas.
3. Do not add large new `StyleSheet.create` blocks for fresh UI unless NativeWind cannot express the need cleanly.
4. Migrate screen-by-screen or component-by-component rather than mixing multiple styling systems chaotically inside one surface.
5. Preserve behavior while migrating appearance.

## 7. Theme and Color Rules

Use semantic values from `constants/theme.ts`.

Preferred tokens in this repo:

- `background`
- `text`
- `tint`
- `icon`
- `tabIconDefault`
- `tabIconSelected`
- `card`
- `border`
- `muted`
- `danger`
- `success`
- `warning`

Guidance:

1. Use `colors.card` + `colors.border` for card surfaces.
2. Use `colors.muted` for supporting text.
3. Use `colors.tint` for primary actions.
4. Use semantic status colors for badges and destructive actions.
5. Avoid raw hex values when an existing semantic color already expresses the intent.
6. Mirror durable theme tokens into `tailwind.config.js` rather than maintaining unrelated theme sources.

## 8. Typography Rules

The repo still uses `ThemedText`; it remains acceptable during migration.

Available text variants:

- `default`
- `title`
- `defaultSemiBold`
- `subtitle`
- `link`

Rules:

1. Prefer `ThemedText` over raw `Text` for themed content unless there is a strong reason not to.
2. Let `ThemedText` provide the default text color unless a semantic override is needed.
3. Do not introduce a separate `Typography` system unless the current variants become insufficient.
4. NativeWind should complement these primitives, not force a parallel text abstraction.

## 9. Shared Primitives to Reuse

Before creating new UI primitives, reuse:

- `components/shared/themed-text.tsx`
- `components/shared/themed-view.tsx`
- `components/shared/EmptyState.tsx`
- `components/shared/ui/icon-symbol.tsx`
- `components/scan/LoadingOverlay.tsx`
- `components/scan/ScanButton.tsx`
- `components/invoice/InvoiceCard.tsx`
- `components/invoice/FinancialSummary.tsx`

If a compatibility primitive becomes redundant after repeated migration work, deprecate it gradually instead of deleting it impulsively.

## 10. Screen Composition Patterns

### Home screen

- route-level data loading and header action wiring
- empty state, loading state, error banner
- list rendering via `FlatList`

### Scan screen

- route-level orchestration only
- actions delegated to `useInvoiceScan`
- preview, error card, and loading overlay visible in the screen

### Settings screen

- Secure Store workflow delegated to `useStoredApiKey`
- form UI remains local to the screen until it becomes large enough to extract

### Invoice detail screen

- route param handling
- detail loading and delete/export actions
- presentational sections composed from invoice components

## 11. Lists and Performance

Use `FlatList` when it fits naturally, like the invoice home list.
Use `ScrollView` for shorter, sectioned detail and form screens.
Do not force virtualization or memoization unless it improves clarity or solves a real problem.

## 12. Async UX Standards

Rules:

1. Every async user action must show a visible loading or disabled state.
2. Every failure path must show a readable user-facing message.
3. Empty states are preferred over blank UI.
4. Confirmation is required before destructive invoice deletion.
5. Retry paths should exist where failure is recoverable.

## 13. Accessibility

Rules:

1. Buttons and tappable cards should expose `accessibilityRole` when helpful.
2. Important actions should remain visually clear in both themes.
3. Do not rely on color alone for critical meaning when a label can help.

## 14. Comments and File Documentation

Rules:

1. Prefer clear naming over comments.
2. Add comments only when a constraint or intent is not obvious.
3. Avoid template comments and noisy narration.

## 15. What Not To Reintroduce

Do not reintroduce outdated assumptions:

1. Do not switch docs back to `StyleSheet.create`-first guidance.
2. Do not add a `Typography` component just because NativeWind is present.
3. Do not introduce `screen/`, `services/`, or Zustand architecture without a real need.
4. Do not copy frontend rules from another product or domain.
5. Do not let styling migrations change scan, export, settings, or persistence behavior.

## 16. Quick Checklist

Before merging frontend work, verify:

- route files stay focused on orchestration
- reused UI lives in `components/`
- workflows stay in hooks or `lib/`
- new styling defaults to NativeWind in touched UI
- semantic colors still come from `Colors` where appropriate
- dark mode still works
- loading, empty, and error states are visible
- no starter/demo UI remains in active flows
- docs still match the actual repo setup
