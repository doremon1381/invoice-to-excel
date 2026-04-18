---
name: invoice-scanner-refactoring-rules
description: Refactoring rules for this React Native Expo invoice scanner app. Applies when modifying files in app/, components/, hooks/, lib/, constants/, or docs-facing setup files. Enforces the project’s actual architecture: Expo Router screens, small presentational components, focused hooks, lib/ services, TypeScript strictness, Secure Store for secrets, SQLite safety, and StyleSheet-based theming.
---

# Invoice Scanner Refactoring Rules

## When to Apply

Use this skill when:
- modifying files in `app/`, `components/`, `hooks/`, `lib/`, or `constants/`
- restructuring screens, hooks, or service modules
- reviewing code quality after feature implementation
- simplifying existing code without changing product behavior
- aligning generated code with this project’s real stack and conventions

Do **not** apply assumptions from other projects such as NativeWind, custom Typography systems, generic `services/contexts/utils/` layers, or web-only patterns unless this repo explicitly adopts them later.

---

## Project Reality Check

This project is:
- React Native + Expo SDK 54
- Expo Router app with route files in `app/`
- TypeScript strict mode
- Styled with `StyleSheet.create`, themed via:
  - `constants/theme.ts`
  - `hooks/use-color-scheme.ts`
  - `hooks/use-theme-color.ts`
  - `components/themed-text.tsx`
  - `components/themed-view.tsx`
- Using `lib/` for non-UI logic:
  - `lib/db.ts`
  - `lib/anthropic.ts`
  - `lib/parser.ts`
  - `lib/export.ts`
  - `lib/types.ts`
  - `lib/constants.ts`
- Using hooks for stateful workflows:
  - `hooks/useStoredApiKey.ts`
  - `hooks/useInvoiceScan.ts`
  - `hooks/useInvoiceExport.ts`

This project is **not** using:
- NativeWind
- className-based styling
- a `Typography` component
- arbitrary Tailwind tokens
- broad controller/manager/service abstractions
- AsyncStorage for secrets

---

## Core Refactoring Goals

1. Keep screens focused on user flow and navigation.
2. Keep components presentational and reusable.
3. Group `components/` and `hooks/` by feature/category instead of letting them grow as one flat folder.
4. Keep hooks responsible for one stateful workflow.
5. Keep `lib/` modules free of React imports.
6. Preserve security boundaries for API keys and AI output.
7. Prefer small, explicit code over broad abstractions.
8. Remove starter/demo code when it no longer serves the app.

---

## Priority Rules

| # | Rule | Impact | Check |
|---|------|--------|-------|
| 1 | No hardcoded API keys or secrets | CRITICAL | review `app/`, `hooks/`, `lib/` |
| 2 | API keys live only in `expo-secure-store` flows | CRITICAL | review `hooks/useStoredApiKey.ts`, settings code |
| 3 | Do not trust model output without parsing/validation | CRITICAL | review `lib/parser.ts`, `lib/anthropic.ts` |
| 4 | No `any` types | CRITICAL | grep for `: any` / `as any` |
| 5 | `lib/` modules must not import React | HIGH | review imports in `lib/*.ts` |
| 6 | Screens should not contain DB/API/export implementation logic inline | HIGH | review `app/**/*.tsx` |
| 7 | Hooks should encapsulate one workflow each | HIGH | review `hooks/*.ts` |
| 8 | Use `StyleSheet.create` and theme helpers consistently | HIGH | review `StyleSheet`, `Colors`, themed components |
| 9 | Use parameterized SQLite queries only | HIGH | review `lib/db.ts` |
| 10 | No leftover Expo starter/demo UI in active routes | HIGH | review `app/`, `components/` |
| 11 | Do not introduce abstractions for single-use code | MEDIUM | visual review |
| 12 | Prefer explicit props interfaces and domain types | MEDIUM | visual review |
| 13 | Surface user-facing errors for async actions | MEDIUM | visual review |
| 14 | Reuse existing helpers before creating new ones | MEDIUM | visual review |

---

## Architecture Boundaries

### 1. Screens (`app/`)

Screens should:
- orchestrate route-level flows
- connect buttons and events to hooks/services
- own loading, confirmation, and navigation behavior
- compose presentational components

Screens should not:
- build raw SQL inline
- construct Anthropic request payloads inline
- parse AI JSON inline
- contain heavy export logic inline
- become giant all-in-one files

### 2. Components (`components/`)

Components should:
- receive clear props
- render reusable UI
- keep logic minimal and presentation-focused
- use project theming primitives consistently

Components should not:
- read/write Secure Store directly
- call SQLite directly
- call the Anthropic API directly
- duplicate full-screen workflow logic

### 3. Hooks (`hooks/`)

Hooks should:
- encapsulate one stateful workflow
- manage loading/error state for async flows
- expose a simple API for screens

Good examples in this project:
- stored API key lifecycle
- invoice scan lifecycle
- invoice export lifecycle

Hooks should not:
- become a dumping ground for unrelated behaviors
- mix navigation, export, database, analytics, and UI layout state without a strong reason

### 4. Non-UI logic (`lib/`)

`lib/` should contain:
- SQLite schema + CRUD helpers
- Anthropic API integration
- JSON parsing/validation
- export logic
- shared domain types/constants

`lib/` files should not:
- import React
- depend on component lifecycle
- own JSX rendering

---

## Styling Rules for This Project

This repo uses `StyleSheet.create` plus theme helpers. Refactor toward consistency with those patterns.

### Preferred styling primitives
- `StyleSheet.create`
- `Colors` from `constants/theme.ts`
- `useColorScheme()`
- `useThemeColor()`
- `ThemedText`
- `ThemedView`

### Good
```tsx
const colorScheme = useColorScheme() ?? 'light';
const colors = Colors[colorScheme];

<View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
  <ThemedText type="defaultSemiBold">Vendor</ThemedText>
</View>
```

### Avoid
```tsx
<View className="p-4 bg-surface">
  <Typography variant="heading">Vendor</Typography>
</View>
```

Do not refactor working code toward NativeWind/className usage unless the project explicitly adopts that stack first.

---

## TypeScript Rules

### Required
- no `any`
- prefer explicit interfaces/types in `lib/types.ts` or local prop interfaces
- use discriminated/string unions where they clarify allowed states
- keep nullable fields explicit, especially for extracted invoice data

### Good
```ts
interface InvoiceCardProps {
  invoice: InvoiceListItem;
  onPress: () => void;
  onDelete: () => void;
}
```

### Avoid
```ts
export function InvoiceCard(props: any) {
  // ...
}
```

---

## Security Rules

### Secrets
- never hardcode Anthropic API keys
- never log API keys
- store keys only with `expo-secure-store`
- if refactoring settings logic, preserve this rule

### AI output
- treat model output as untrusted input
- parse and validate before persistence
- never assume the model returned clean JSON

### SQLite
- always use bound parameters
- never build SQL by concatenating user/model values into query strings

### Errors
- user-facing messages should be readable
- do not expose raw secrets or sensitive payloads in alerts/logs

---

## Refactoring Patterns to Prefer

### 1. Extract repeated formatting helpers
If invoice amount/date formatting repeats in multiple places, extract a small helper.

### 2. Move workflow state out of screens
If a screen grows because it manages scan/export state in many places, move that workflow into a hook.

### 3. Keep one source of truth for domain shapes
If multiple files redefine invoice or line-item shapes, consolidate them into `lib/types.ts`.

### 4. Keep API request details centralized
If screen code knows Anthropic endpoint/model/header details, move that knowledge into `lib/anthropic.ts`.

### 5. Remove dead starter code aggressively
If a starter component or route is no longer referenced, remove it rather than keeping demo code around.

---

## Refactoring Smells

Watch for these in this project:
- route files overgrown with parsing/export/database code
- hooks that manage more than one distinct workflow
- components that fetch or persist data directly
- duplicated invoice field rendering blocks
- multiple ad-hoc currency/date formatting snippets
- direct use of raw `Text`/`View` where `ThemedText`/`ThemedView` should be used for themed content
- flat `components/` and `hooks/` folders growing into unrelated file graveyards
- stale Expo starter files still referenced by active routes
- comments that describe obvious code instead of explaining non-obvious decisions

---

## File Placement Rules

| Kind of code | Put it in |
|---|---|
| Route orchestration | `app/...` |
| Reusable UI | `components/<category>/...` |
| Stateful workflow | `hooks/<category>/...` |
| Database/API/parser/export logic | `lib/...` |
| Shared domain types/constants | `lib/types.ts`, `lib/constants.ts`, `constants/theme.ts` |

### Folder organization rule

Do **not** keep `components/` and `hooks/` as large flat folders once the app has multiple domains.

Prefer category-based subfolders such as:

```text
components/
  invoice/
    InvoiceCard.tsx
    FinancialSummary.tsx
    InvoiceFieldRow.tsx
    LineItemsList.tsx
  scan/
    ScanButton.tsx
    LoadingOverlay.tsx
    ImagePreview.tsx
  settings/
    ApiKeyForm.tsx
  shared/
    EmptyState.tsx
    themed-text.tsx
    themed-view.tsx
    ui/
      icon-symbol.tsx
      icon-symbol.ios.tsx

hooks/
  invoice/
    useInvoiceExport.ts
  scan/
    useInvoiceScan.ts
  settings/
    useStoredApiKey.ts
  theme/
    use-color-scheme.ts
    use-theme-color.ts
```

### Category guidance

Group by feature or view responsibility, not by file type alone:
- `components/invoice/` for invoice list/detail UI
- `components/scan/` for scan/import/loading UI
- `components/settings/` for settings-specific UI
- `components/shared/` for primitives reused across multiple areas
- `hooks/invoice/` for invoice read/export state
- `hooks/scan/` for scan/import workflow state
- `hooks/settings/` for API key/settings state
- `hooks/theme/` for color/theme helpers

### Layout/view-specific rule

When a screen grows beyond a few supporting files, create a dedicated view/category folder rather than adding more files to the root:
- Home/invoice-list related files live together
- Scan-related files live together
- Settings-related files live together
- Shared primitives stay in `shared/`

### Avoid
- `components/` containing 20+ unrelated files side by side
- `hooks/` containing every hook for every feature in one flat directory
- splitting into too many tiny folders for one-file categories

### Good threshold

Create a category folder when:
- a feature has 2 or more related components, or
- a feature has 2 or more related hooks, or
- a screen/view has supporting UI that is easiest to understand together

Do not create new top-level folders like `services/`, `contexts/`, or `utils/` unless the current structure genuinely stops fitting the app.

---

## Review Checklist

Before finishing a refactor, verify:
- [ ] No secrets were introduced into source
- [ ] No `any` types were introduced
- [ ] `lib/` remains free of React imports
- [ ] Screen files got simpler, not more coupled
- [ ] Related components are grouped into sensible category folders when the feature warrants it
- [ ] Related hooks are grouped into sensible category folders when the feature warrants it
- [ ] Repeated logic was reduced without over-abstracting
- [ ] Theme usage still works for light/dark mode
- [ ] DB/API/export logic remains outside presentational components
- [ ] AI parsing remains validated before save
- [ ] Dead starter/demo code was removed if no longer useful
- [ ] Lint and type checks still pass

---

## Success Criteria

A good refactor in this repo should:
- make file responsibilities clearer
- reduce duplication without inventing framework-y layers
- preserve Expo/mobile constraints
- improve security and correctness around keys, parsing, and persistence
- keep the app easier to extend for invoice scanning, review, deletion, and export
