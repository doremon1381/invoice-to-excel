# ChargePlug EndUser Palette Reference

Updated: 2026-03-27

This file is the detailed palette reference for the current `ChargePlug_user` app.

Primary source of truth:
- `styles/tokens.shared.js`
- `styles/tokens.ts`
- `tailwind.config.js`

Audit coverage:
- `app/`
- `components/`
- `screen/`
- `hooks/`
- `services/`
- `utils/`

## 1. How the palette is exposed

JavaScript/TypeScript access:

```ts
import { colors } from '@/styles/tokens';

const palette = colors[theme];
palette.surface;
palette.accent;
```

Tailwind/NativeWind access:

```tsx
bg-surface dark:bg-surface-dark
text-foreground dark:text-foreground-dark
border-border dark:border-border-dark
bg-accent dark:bg-accent-dark
```

Theme-scoped aliases also exist:

```tsx
bg-light-surface
bg-dark-surface
text-light-foreground
text-dark-foreground
```

## 2. Light palette

| Group | Token | Value | Current usage |
|---|---|---|---|
| Background | `background` | `#F8FAFC` | App canvas |
| Background | `backgroundVia` | `#F8FAFC` | Gradient background |
| Background | `backgroundTo` | `#F8FAFC` | Gradient background |
| Text | `foreground` | `#1F2937` | Primary text |
| Text | `muted` | `#6B7280` | Secondary text |
| Text | `mutedLight` | `#9CA3AF` | Muted labels |
| Surface | `surface` | `#FFFFFF` | Main cards |
| Surface | `surfaceAlt` | `#FFF5F9` | Inactive filter, soft cards |
| Surface | `surfaceFull` | `#FFF5F9` | Full solid soft surface |
| Header | `headerBgFrom` | `#FFFFFF` | Header gradient start |
| Header | `headerBgVia` | `#FFF1F6` | Header gradient mid |
| Header | `headerBgTo` | `#FCE7F3` | Header gradient end |
| Header | `headerBorder` | `#F3E8EE` | Header border |
| Header | `headerOrb1` | `#F472B6` | Header orb |
| Header | `headerOrb2` | `#EC4899` | Header orb |
| Accent | `accent` | `#F472B6` | Primary CTA base |
| Accent | `accentSoft` | `rgba(236, 72, 153, 0.10)` | Soft pink fill |
| Accent | `accentSoft2` | `rgba(236, 72, 153, 0.06)` | Lighter hover/soft fill |
| Accent | `filterActive` | `rgba(236, 72, 153, 0.12)` | Active filter bg |
| Accent | `navActiveFrom` | `rgba(244, 114, 182, 0.15)` | Active tab bg |
| Accent | `navActiveBorder` | `#F9A8D4` | Active tab border |
| Gradient | `titleGradientFrom` | `#EC4899` | Page title gradient |
| Gradient | `titleGradientTo` | `#F472B6` | Page title gradient |
| Gradient | `scanFrom` | `#F472B6` | Scan CTA gradient start |
| Gradient | `scanTo` | `#F9A8D4` | Scan CTA gradient end |
| Border | `border` | `#F3E8EE` | Main border |
| Border | `borderFocus` | `#F9A8D4` | Focus border |
| Divider | `divider` | `#E5E7EB` | Divider |
| Fixed | `logoFixed` | `#B4A3F0` | Brand logo text |

## 3. Dark palette

| Group | Token | Value | Current usage |
|---|---|---|---|
| Background | `background` | `#0F172A` | App canvas |
| Background | `backgroundVia` | `#0F172A` | Gradient background |
| Background | `backgroundTo` | `#0F172A` | Gradient background |
| Text | `foreground` | `#F9FAFB` | Primary text |
| Text | `muted` | `#9CA3AF` | Secondary text |
| Text | `mutedLight` | `#6B7280` | Muted labels |
| Surface | `surface` | `rgba(31, 41, 55, 0.90)` | Main cards |
| Surface | `surfaceAlt` | `#111827` | Inactive filter, soft panels |
| Surface | `surfaceFull` | `#1F2937` | Full solid surface |
| Header | `headerBgFrom` | `#0F172A` | Header gradient start |
| Header | `headerBgVia` | `#1E293B` | Header gradient mid |
| Header | `headerBgTo` | `#334155` | Header gradient end |
| Header | `headerBorder` | `#334155` | Header border |
| Header | `headerOrb1` | `#60A5FA` | Header orb |
| Header | `headerOrb2` | `#A78BFA` | Header orb |
| Accent | `accent` | `#60A5FA` | Primary CTA base |
| Accent | `accentSoft` | `rgba(96, 165, 250, 0.12)` | Soft blue fill |
| Accent | `accentSoft2` | `rgba(96, 165, 250, 0.08)` | Lighter hover/soft fill |
| Accent | `accentBorder` | `#93C5FD` | Accent border |
| Accent | `accentBorderHover` | `#C4B5FD` | Accent hover border |
| Accent | `filterActive` | `rgba(96, 165, 250, 0.15)` | Active filter bg |
| Accent | `navActiveFrom` | `rgba(96, 165, 250, 0.20)` | Active tab bg |
| Accent | `navActiveBorder` | `#93C5FD` | Active tab border |
| Gradient | `titleGradientFrom` | `#60A5FA` | Page title gradient |
| Gradient | `titleGradientTo` | `#3B82F6` | Page title gradient |
| Gradient | `scanFrom` | `#60A5FA` | Scan CTA gradient start |
| Gradient | `scanTo` | `#93C5FD` | Scan CTA gradient end |
| Border | `border` | `#334155` | Main border |
| Border | `borderFocus` | `#93C5FD` | Focus border |
| Divider | `divider` | `#1F2937` | Divider / grid pattern |
| Fixed | `logoFixed` | `#B4A3F0` | Brand logo text |

## 4. Semantic palette

| Semantic | Light | Dark | Notes |
|---|---|---|---|
| `available` | `#16A34A` | `#4ADE80` | Ready/available status |
| `availableSoft` | `rgba(34, 197, 94, 0.12)` | `rgba(74, 222, 128, 0.18)` | Available badge bg |
| `success` | `#EC4899` | `#60A5FA` | General success accent |
| `successSoft` | `rgba(236, 72, 153, 0.12)` | `rgba(96, 165, 250, 0.15)` | Soft success bg |
| `warning` | `#F472B6` | `#93C5FD` | General warning token |
| `danger` | `#EF4444` | `#EF4444` | Error/danger |
| `dangerSoft` | `rgba(253, 237, 237, 0.9)` | `rgba(58, 30, 30, 0.9)` | Danger background |
| `sessionStable` | `#15803D` | `#4ADE80` | Active session stable |
| `sessionWarning` | `#EA580C` | `#FB923C` | Low package / session near end |
| `sessionDanger` | `#DC2626` | `#F87171` | Faulted/offline/stopping |

## 5. Special token clusters

Stat/icon cluster:

| Token | Light | Dark |
|---|---|---|
| `emeraldText` | `#EC4899` | `#60A5FA` |
| `blueText` | `#EC4899` | `#C4B5FD` |
| `purpleText` | `#EC4899` | `#818CF8` |
| `statIconBg` | `#FFF5F9` | `#1F2937` |

Bottom tab cluster:

| Token | Light | Dark |
|---|---|---|
| `tabBarBg` | `rgba(255, 255, 255, 1)` | `rgba(15, 23, 42, 1)` |
| `tabBarBgTo` | `rgba(255, 255, 255, 1)` | `rgba(30, 41, 59, 1)` |
| `tabBarLineA` | `#F9A8D4` | `#93C5FD` |
| `tabBarLineB` | none | `#C4B5FD` |
| `navInactive` | `#9CA3AF` | `#6B7280` |

## 6. Non-token overrides found in source

These are real colors in code that do not come directly from `tokens.shared.js`.

| Value | File area | Why it exists |
|---|---|---|
| `#5B556B` | `components/stations/station-card.tsx`, `screen/StationDetailScreen.tsx` | Light address text |
| `#CBD5E1` | `components/stations/station-card.tsx`, `screen/StationDetailScreen.tsx` | Dark address text |
| `#6F667C` | `components/stations/station-card.tsx` | Light description text |
| `#A8B5C8` | `components/stations/station-card.tsx` | Dark description text |
| `#DB2777` | station cards/detail | Pink shadow for voucher/direction chips |
| `rgba(255, 252, 255, 0.96)` | station cards/detail | Frosted light chip/card surface |
| `rgba(96, 165, 250, 0.10)` | station cards/detail | Frosted dark chip/card surface |
| `rgba(244, 114, 182, 0.30)` | station cards/detail | Top border glow line |
| `rgba(96, 165, 250, 0.22)` | scan + station cards/detail | Dark frame and highlight border |
| `rgba(244, 114, 182, 0.28)` | scan | Light scanner frame border |
| `rgba(0,0,0,0.6)` | scan | Error modal scrim |
| `rgba(15, 23, 42, 0.08)` | account/profile success toast | Light full-screen scrim |
| `rgba(2, 6, 23, 0.34)` | account/profile success toast | Dark full-screen scrim |
| `rgba(248, 250, 252, 0.58)` | topup success overlay | Light overlay scrim |
| `rgba(15, 23, 42, 0.42)` | topup success overlay | Dark overlay scrim |
| `#FFFFFF` | `screen/TopUpVietQR.tsx` | Explicit spinner color on accent button |

## 7. Class usage cheat sheet

| Purpose | Recommended class pattern |
|---|---|
| Page background | `bg-background dark:bg-background-dark` |
| Card | `bg-surface dark:bg-surface-dark` |
| Soft card / inactive filter | `bg-surface-alt dark:bg-surface-alt-dark` |
| Input | `bg-input dark:bg-input-dark` |
| Primary text | `text-foreground dark:text-foreground-dark` |
| Secondary text | `text-muted dark:text-muted-dark` |
| Muted text | `text-muted-light dark:text-muted-light-dark` |
| Primary CTA | `bg-accent dark:bg-accent-dark text-on-accent` |
| Secondary accent panel | `bg-accent-soft dark:bg-accent-soft-dark` |
| Border | `border-border dark:border-border-dark` |
| Success | `bg-success-soft dark:bg-success-soft-dark text-success dark:text-success-dark` |
| Danger | `bg-danger-soft dark:bg-danger-soft-dark text-danger dark:text-danger-dark` |

## 8. Audit conclusion

- The app is now mostly token-driven.
- The biggest drift from old docs was in the light background and scan CTA gradient.
- The main exceptions are station-rich cards, scan overlays, and success/toast overlays.
- If a new color is needed, prefer adding a token first, then exposing it through `tailwind.config.js`, and only keep it hardcoded when it is truly screen-specific.
