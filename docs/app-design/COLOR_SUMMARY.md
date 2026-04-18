# Invoice Scanner Color Summary

Updated: 2026-04-18

This file summarizes the colors currently used in `invoice-to-excel-expo`.

Source of truth:

- `constants/theme.ts`
- `components/shared/themed-text.tsx`
- `components/shared/themed-view.tsx`
- `hooks/theme/use-theme-color.ts`

## 1. Theme direction

| Theme | Direction | Current feel |
|---|---|---|
| Light | Neutral light background with blue primary tint | Clean, utility-focused, readable |
| Dark | Charcoal background with white primary tint | Minimal, high-contrast, functional |

## 2. Core palette in use

| Role | Light | Dark | Token |
|---|---|---|---|
| App background | `#fff` | `#151718` | `background` |
| Primary text | `#11181C` | `#ECEDEE` | `text` |
| Primary action / selected tab | `#0a7ea4` | `#fff` | `tint`, `tabIconSelected` |
| Secondary icon | `#687076` | `#9BA1A6` | `icon`, `tabIconDefault` |
| Card surface | `#F5F7FA` | `#1E232A` | `card` |
| Border | `#D9E2EC` | `#2D3640` | `border` |
| Secondary text | `#52606D` | `#9BA1A6` | `muted` |
| Danger | `#D64545` | `#FF7B72` | `danger` |
| Success | `#127A4D` | `#3FB950` | `success` |
| Warning | `#B26A00` | `#D29922` | `warning` |

## 3. Current usage guidance

Use these semantic values consistently:

- page background: `colors.background`
- body text: `colors.text`
- muted/supporting text: `colors.muted`
- card surfaces: `colors.card`
- borders: `colors.border`
- primary buttons and active tab icons: `colors.tint`
- destructive actions and error text: `colors.danger`
- success and warning badges: `colors.success`, `colors.warning`

## 4. Known raw color overrides

These remain acceptable as local-only values when a semantic token does not fit:

- `components/shared/themed-text.tsx`
  - link variant color: `#0a7ea4`
- `components/scan/LoadingOverlay.tsx`
  - backdrop scrim: `rgba(0, 0, 0, 0.35)`

If similar raw colors begin to repeat across multiple files, promote them into `constants/theme.ts`.

## 5. Audit conclusion

- The app uses a small semantic palette rather than a large token system.
- Theme usage is centered on `Colors`, `useColorScheme`, `useThemeColor`, `ThemedText`, and `ThemedView`.
- New UI should follow the existing semantic palette instead of introducing a parallel design token layer.
