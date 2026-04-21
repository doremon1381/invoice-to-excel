# React Native Color Summary & Palette Reference

Updated: 2026-04-20

This document is the unified color summary and design-token reference for the Smart Key React Native application. It merges the audit template and the palette definition into a single source of truth.

## 1. Audit Purpose

Use this document to answer:

1. What colors are currently used across the app?
2. Which colors come from design tokens and which are hardcoded?
3. Are light and dark mode both covered consistently?
4. Are semantic roles applied consistently?
5. Which color usages should be promoted, renamed, or removed?

## 2. Theme Direction Summary

| Theme | Direction | Current feel |
|---|---|---|
| Light | Neutral base with pink primary accent (#F472B6`) | Clean, bright, warm, consumer-friendly |
| Dark | Deep slate/navy base with blue accent (#60A5FA`) | Focused, calm, high contrast, tech-forward |

## 3. Token Architecture

Use a layered token model.

### Raw tokens

Raw tokens define concrete palette values.

Examples:

- `pink-400` → #F472B6`
- `pink-500` → #EC4899`
- `pink-300` → #F9A8D4`
- `blue-400` → #60A5FA`
- `blue-500` → #3B82F6`
- `blue-300` → #93C5FD`
- `slate-950` → #020617`
- `slate-900` → #0F172A`
- `green-600` → #16A34A`
- `red-600` → #DC2626`

### Semantic tokens

Semantic tokens map raw values to UI meaning:

- `background`, `surface`, `surfaceAlt`
- `foreground`, `muted`, `mutedLight`
- `border`, `divider`
- `accent`, `accentSoft`, `accentBorder`
- `success`, `warning`, `danger`
- `onAccent`, `onDanger`

### Component usage

Components should consume semantic roles instead of raw palette names:

- Cards → `surface`
- Page backgrounds → `background`
- Primary CTA buttons → `accent`
- Destructive buttons → `danger`

Rules:

1. Components should rarely know about raw palette values.
2. Repeated raw values should be promoted into semantic tokens.
3. The same semantic role should mean the same thing across the app.

## 4. Core Palette — Light Mode

Main accent: **#F472B6` (Pink-400)**

| Group | Token | Value | Usage |
|---|---|---|---|
| Background | `background` | #F8FAFC | App canvas |
| Surface | `surface` | #FFFFFF | Main cards and sheets |
| Surface | `surfaceAlt` | #FFF5F9 | Secondary panels, soft cards |
| Text | `foreground` | #1F2937 | Primary text |
| Text | `muted` | #6B7280 | Secondary text |
| Text | `mutedLight` | #9CA3AF | Hints and low-emphasis labels |
| Border | `border` | #F3E8EE | Borders and dividers |
| Border | `borderFocus` | #F9A8D4 | Focus ring / active border |
| Divider | `divider` | #E5E7EB | Divider lines |
| Accent | `accent` | #F472B6 | Primary CTA |
| Accent | `accentSoft` | `rgba(236, 72, 153, 0.10)` | Soft accent background / chip |
| Accent | `accentSoft2` | `rgba(236, 72, 153, 0.06)` | Lighter hover / soft fill |
| Accent | `accentBorder` | #F9A8D4 | Accent border on active elements |
| Gradient | `titleGradientFrom` | #EC4899 | Page title gradient start |
| Gradient | `titleGradientTo` | #F472B6 | Page title gradient end |
| Gradient | `scanFrom` | #F472B6 | CTA gradient start |
| Gradient | `scanTo` | #F9A8D4 | CTA gradient end |
| Success | `success` | #16A34A | Success state |
| Warning | `warning` | #D97706 | Warning state |
| Danger | `danger` | #DC2626 | Error and destructive state |
| Text | `onAccent` | #FFFFFF | Text on accent backgrounds |
| Text | `onDanger` | #FFFFFF | Text on danger backgrounds |

## 5. Core Palette — Dark Mode

Main accent: **#60A5FA` (Blue-400)**

| Group | Token | Value | Usage |
|---|---|---|---|
| Background | `background` | #020617 | App canvas |
| Surface | `surface` | #0F172A | Main cards and sheets |
| Surface | `surfaceAlt` | #1E293B | Secondary panels |
| Text | `foreground` | #F8FAFC | Primary text |
| Text | `muted` | #CBD5E1 | Secondary text |
| Text | `mutedLight` | #94A3B8 | Hints and low-emphasis labels |
| Border | `border` | #334155 | Borders and dividers |
| Border | `borderFocus` | #93C5FD | Focus ring / active border |
| Divider | `divider` | #1F2937 | Divider lines |
| Accent | `accent` | #60A5FA | Primary CTA |
| Accent | `accentSoft` | `rgba(96, 165, 250, 0.12)` | Soft accent background / chip |
| Accent | `accentSoft2` | `rgba(96, 165, 250, 0.08)` | Lighter hover / soft fill |
| Accent | `accentBorder` | #93C5FD | Accent border on active elements |
| Gradient | `titleGradientFrom` | #60A5FA | Page title gradient start |
| Gradient | `titleGradientTo` | #3B82F6 | Page title gradient end |
| Gradient | `scanFrom` | #60A5FA | CTA gradient start |
| Gradient | `scanTo` | #93C5FD | CTA gradient end |
| Success | `success` | #4ADE80 | Success state |
| Warning | `warning` | #F59E0B | Warning state |
| Danger | `danger` | #F87171 | Error and destructive state |
| Text | `onAccent` | #FFFFFF | Text on accent backgrounds |
| Text | `onDanger` | #FFFFFF | Text on danger backgrounds |

## 6. Semantic State Palette

| Semantic role | Light | Dark | Notes |
|---|---|---|---|
| `success` | #16A34A | #4ADE80 | Positive confirmation |
| `successSoft` | #DCFCE7 | #14532D | Soft success background |
| `warning` | #D97706 | #F59E0B | Caution state |
| `warningSoft` | #FEF3C7 | #78350F | Soft warning background |
| `danger` | #DC2626 | #F87171 | Error or destructive state |
| `dangerSoft` | #FEE2E2 | #7F1D1D | Soft danger background |
| `info` | #EC4899 | #60A5FA | Informational state |
| `infoSoft` | `rgba(236, 72, 153, 0.10) | `rgba(96, 165, 250, 0.12) | Soft informational background |

## 7. Brand and Chrome

| Area | Light | Dark |
|---|---|---|
| Header bg gradient | #FFFFFF → #FFF1F6 → #FCE7F3 | #0F172A → #1E293B → #334155 |
| Header glow | rgba(236, 72, 153, 0.12) | rgba(96, 165, 250, 0.15) |
| Tab active bg | rgba(244, 114, 182, 0.15) | rgba(96, 165, 250, 0.20) |
| Tab active border | #F9A8D4 | #93C5FD |
| Tab inactive icon | #9CA3AF | #6B7280 |
| CTA gradient | #F472B6 → #F9A8D4 | #60A5FA → #93C5FD |

## 8. Contrast Requirements

1. Normal body text should meet WCAG AA contrast against its background.
2. Interactive text should remain readable in pressed, disabled, and focused states.
3. Status colors should not rely on hue alone; pair with text, icons, or labels.
4. Check both light and dark mode separately.
5. If a color looks correct but fails contrast, change the token rather than forcing exceptions.

## 9. Usage Rules

1. Use `background` for screen canvas, not `surface`.
2. Use `surface` for cards, sheets, and elevated panels.
3. Use `foreground` for primary text and `muted` for supporting text.
4. Use `accent` for primary interactions, not for every decorative detail.
5. Use `danger` only when the action or status is actually destructive.
6. Keep border colors subtle; borders should support structure, not dominate.
7. Introduce new semantic roles only when the meaning is stable and reused.

## 10. Implementation Example

```ts
export const colors = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceAlt: '#FFF5F9',
    foreground: '#1F2937',
    muted: '#6B7280',
    mutedLight: '#9CA3AF',
    border: '#F3E8EE',
    borderFocus: '#F9A8D4',
    divider: '#E5E7EB',
    accent: '#F472B6',
    accentSoft: 'rgba(236, 72, 153, 0.10)',
    accentBorder: '#F9A8D4',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    onAccent: '#FFFFFF',
    onDanger: '#FFFFFF',
  },
  dark: {
    background: '#020617',
    surface: '#0F172A',
    surfaceAlt: '#1E293B',
    foreground: '#F8FAFC',
    muted: '#CBD5E1',
    mutedLight: '#94A3B8',
    border: '#334155',
    borderFocus: '#93C5FD',
    divider: '#1F2937',
    accent: '#60A5FA',
    accentSoft: 'rgba(96, 165, 250, 0.12)',
    accentBorder: '#93C5FD',
    success: '#4ADE80',
    warning: '#F59E0B',
    danger: '#F87171',
    onAccent: '#FFFFFF',
    onDanger: '#FFFFFF',
  },
};
```

## 11. Hardcoded Override Tracking

Track every meaningful hardcoded color that does not come from the token system.

| Value | Location | Purpose | Keep local or promote? |
|---|---|---|---|
| `rgba(0, 0, 0, 0.4)` | Modal scrim | Overlay background | Keep local |
| `rgba(15, 23, 42, 0.08)` | Success toast scrim | Light overlay | Keep local |
| `rgba(2, 6, 23, 0.34)` | Success toast scrim | Dark overlay | Keep local |

Rules:

1. Keep truly local visual effects local.
2. Promote repeated hardcoded values into semantic tokens.
3. Remove accidental duplicates when the same visual meaning already exists in tokens.

## 12. Source of Truth

- Primary color tokens are stored in a shared tokens file (e.g. `styles/tokens.ts`).
- Light and dark mode values are exported from the same module.
- Components consume semantic tokens, NOT raw hex values.
- One source of truth only — remove unofficial duplicates.

## 13. Consistency Checklist

- [ ] Background and surface roles are distinct
- [ ] Text colors are readable in both themes
- [ ] Primary actions use one stable accent color (#F472B6` light / #60A5FA` dark)
- [ ] Success, warning, and danger colors are used consistently
- [ ] Borders and dividers are subtle and consistent
- [ ] Disabled states are visually distinct
- [ ] Overlays and scrims are intentional
- [ ] Hardcoded colors are documented
- [ ] Duplicate semantic tokens are removed
- [ ] Color meaning is not communicated by hue alone

## 14. Maintenance Rules

1. Keep one clear source of truth for color tokens.
2. Audit hardcoded colors regularly.
3. Promote repeated color literals into tokens.
4. Remove obsolete tokens when they are no longer used.
5. Document one-off local overrides only when they are intentional and visually meaningful.
