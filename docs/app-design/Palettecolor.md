# Invoice Scanner Palette Reference

Updated: 2026-04-18

This file is the detailed palette reference for `invoice-to-excel-expo`.

Primary source of truth:

- `constants/theme.ts`
- `hooks/theme/use-color-scheme.ts`
- `hooks/theme/use-theme-color.ts`
- `components/shared/themed-text.tsx`
- `components/shared/themed-view.tsx`

Audit coverage:

- `app/`
- `components/`
- `hooks/`
- `lib/`

## 1. How the palette is exposed

JavaScript/TypeScript access:

```ts
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/theme/use-color-scheme';

const colorScheme = useColorScheme() ?? 'light';
const colors = Colors[colorScheme];

colors.card;
colors.border;
colors.tint;
```

Themed primitive access:

```tsx
import { ThemedText } from '@/components/shared/themed-text';
import { ThemedView } from '@/components/shared/themed-view';
```

## 2. Light palette

| Group | Token | Value | Current usage |
|---|---|---|---|
| Background | `background` | `#fff` | App canvas |
| Text | `text` | `#11181C` | Primary text |
| Accent | `tint` | `#0a7ea4` | Primary action, selected tab |
| Icon | `icon` | `#687076` | Supporting icons |
| Surface | `card` | `#F5F7FA` | Cards, panels, banners |
| Border | `border` | `#D9E2EC` | Borders and separators |
| Secondary text | `muted` | `#52606D` | Supporting copy |
| Danger | `danger` | `#D64545` | Errors, delete action |
| Success | `success` | `#127A4D` | Success badge/status |
| Warning | `warning` | `#B26A00` | Warning/pending badge |

## 3. Dark palette

| Group | Token | Value | Current usage |
|---|---|---|---|
| Background | `background` | `#151718` | App canvas |
| Text | `text` | `#ECEDEE` | Primary text |
| Accent | `tint` | `#fff` | Primary action, selected tab |
| Icon | `icon` | `#9BA1A6` | Supporting icons |
| Surface | `card` | `#1E232A` | Cards, panels, banners |
| Border | `border` | `#2D3640` | Borders and separators |
| Secondary text | `muted` | `#9BA1A6` | Supporting copy |
| Danger | `danger` | `#FF7B72` | Errors, delete action |
| Success | `success` | `#3FB950` | Success badge/status |
| Warning | `warning` | `#D29922` | Warning/pending badge |

## 4. Semantic guidance

| Purpose | Recommended token |
|---|---|
| Screen background | `background` |
| Card background | `card` |
| Standard text | `text` |
| Supporting text | `muted` |
| Primary action | `tint` |
| Error state | `danger` |
| Success state | `success` |
| Pending/warning state | `warning` |

## 5. Local overrides

Local-only colors currently used in source:

| Value | File area | Why it exists |
|---|---|---|
| `rgba(0, 0, 0, 0.35)` | `components/scan/LoadingOverlay.tsx` | Full-screen loading scrim |
| `#0a7ea4` | `components/shared/themed-text.tsx` | Link text variant |

## 6. Usage checklist

When adding or refactoring UI:

1. Start from `Colors[colorScheme]`.
2. Prefer `ThemedText` and `ThemedView` for themed defaults.
3. Use semantic tokens before adding raw colors.
4. Keep local raw colors tightly scoped.
5. Verify both light and dark mode after changes.

## 7. Audit conclusion

- This app does not use Tailwind or NativeWind tokens.
- The palette is intentionally small and semantic.
- Consistency matters more than visual complexity for this product.
