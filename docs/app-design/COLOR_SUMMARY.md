# ChargePlug EndUser Color Summary

Audit date: 2026-03-27

Scope reviewed:
- `styles/tokens.shared.js`
- `tailwind.config.js`
- `app/`, `components/`, `screen/`, `hooks/`, `services/`, `utils/` trong `ChargePlug_user`

## 1. Theme direction

| Theme | Direction | Current feel |
|---|---|---|
| Light | Cool neutral base + pink accent | Sạch, sáng, mềm, consumer-friendly |
| Dark | Slate/navy base + blue-violet accent | Tech, rõ tương phản, hợp luồng EV/IoT |

Điểm khác lớn so với tài liệu cũ:
- Nền light hiện tại là `#F8FAFC`, không còn là `#FFFBFD`.
- CTA/primary accent light đang lấy `accent = #F472B6`.
- Nút scan đang dùng gradient `#F472B6 -> #F9A8D4`, không phải `#EC4899 -> #F472B6`.

## 2. Core palette đang dùng thực tế

| Role | Light | Dark | Token |
|---|---|---|---|
| App background | `#F8FAFC` | `#0F172A` | `background` |
| Main surface/card | `#FFFFFF` | `rgba(31, 41, 55, 0.90)` | `surface` |
| Secondary surface | `#FFF5F9` | `#111827` | `surfaceAlt` |
| Primary text | `#1F2937` | `#F9FAFB` | `foreground` |
| Secondary text | `#6B7280` | `#9CA3AF` | `muted` |
| Muted text | `#9CA3AF` | `#6B7280` | `mutedLight` |
| Primary accent | `#F472B6` | `#60A5FA` | `accent` |
| Soft accent bg | `rgba(236, 72, 153, 0.10)` | `rgba(96, 165, 250, 0.12)` | `accentSoft` |
| Accent border/focus | `#F9A8D4` | `#93C5FD` | `borderFocus` / `accentBorder` |
| Border | `#F3E8EE` | `#334155` | `border` |
| Divider | `#E5E7EB` | `#1F2937` | `divider` |
| On-accent text | `#FFFFFF` | `#FFFFFF` | `onAccent` |

## 3. Brand and chrome

| Area | Light | Dark |
|---|---|---|
| Header bg | `#FFFFFF -> #FFF1F6 -> #FCE7F3` | `#0F172A -> #1E293B -> #334155` |
| Header glow | `rgba(236, 72, 153, 0.12)` | `rgba(96, 165, 250, 0.15)` |
| Logo text | `#B4A3F0` | `#B4A3F0` |
| Page title/divider gradient | `#EC4899 -> #F472B6` | `#60A5FA -> #3B82F6` |
| Tab active bg | `rgba(244, 114, 182, 0.15)` | `rgba(96, 165, 250, 0.20)` |
| Tab active border | `#F9A8D4` | `#93C5FD` |
| Tab inactive icon | `#9CA3AF` | `#6B7280` |
| Scan CTA gradient | `#F472B6 -> #F9A8D4` | `#60A5FA -> #93C5FD` |

## 4. Semantic states

| State | Light | Dark | Notes |
|---|---|---|---|
| Available | `#16A34A` | `#4ADE80` | Socket available, success toast |
| Available soft | `rgba(34, 197, 94, 0.12)` | `rgba(74, 222, 128, 0.18)` | Soft badge/background |
| Warning | `#F472B6` | `#93C5FD` | General token warning |
| Danger | `#EF4444` | `#EF4444` | Error/danger button |
| Session stable | `#15803D` | `#4ADE80` | Active session safe state |
| Session warning | `#EA580C` | `#FB923C` | Low package / near end |
| Session danger | `#DC2626` | `#F87171` | Faulted/stopping/offline |

## 5. Màu theo flow chính

- Dashboard, auth, phần lớn account, plan cards, modal, form và layout shell dùng token hóa khá sạch qua class `bg-*`, `text-*`, `border-*`.
- `stations` và `station detail` có thêm lớp override riêng để card giàu thông tin hơn:
  - Address light `#5B556B`, dark `#CBD5E1`
  - Description light `#6F667C`, dark `#A8B5C8`
  - Voucher/directions card light `rgba(255, 252, 255, 0.96)`, dark `rgba(96, 165, 250, 0.10)`
  - Accent shadow light `#DB2777`
- `scan` có overlay riêng:
  - Frame border light `rgba(244, 114, 182, 0.28)`
  - Frame border dark `rgba(96, 165, 250, 0.22)`
  - Error scrim `rgba(0,0,0,0.6)`
- `plans` dùng semantic warning riêng cho session near-end:
  - Fallback color `#EA580C`
  - Soft bg `rgba(249, 115, 22, 0.14)`
- Toast/overlay thành công trong account và topup dùng thêm lớp scrim và glass surface:
  - Light scrim `rgba(15, 23, 42, 0.08)` hoặc `rgba(248, 250, 252, 0.58)`
  - Dark scrim `rgba(2, 6, 23, 0.34)` hoặc `rgba(15, 23, 42, 0.42)`

## 6. Hardcoded overrides cần nhớ

| Color | Found in | Purpose |
|---|---|---|
| `#5B556B`, `#CBD5E1` | Station list, station detail | Address text |
| `#6F667C`, `#A8B5C8` | Station list | Description text |
| `#DB2777` | Station list, station detail | Pink shadow on voucher/direction cards |
| `rgba(255, 252, 255, 0.96)` | Station list, station detail | Frosted light chip/card |
| `rgba(96, 165, 250, 0.10)` | Station list, station detail | Frosted dark chip/card |
| `rgba(244, 114, 182, 0.30)` | Station list, station detail | Top highlight line on card |
| `rgba(96, 165, 250, 0.22)` | Scan, station list, station detail | Dark frame/top-line border |
| `rgba(34, 197, 94, 0.10/0.16)` | Station list, station detail | Available badge background/border |
| `rgba(239, 68, 68, 0.08/0.14)` | Station list, station detail | Unavailable badge background/border |
| `rgba(2, 6, 23, 0.34)` | Account/profile success toast | Dark overlay scrim |
| `rgba(15, 23, 42, 0.08)` | Account/profile success toast | Light overlay scrim |
| `#FFFFFF` | TopUp spinner | Explicit loading indicator color |

## 7. Recommended source of truth

- Palette gốc: `styles/tokens.shared.js`
- TypeScript export: `styles/tokens.ts`
- Tailwind alias: `tailwind.config.js`

Ưu tiên dùng:
- `bg-surface dark:bg-surface-dark`
- `bg-surface-alt dark:bg-surface-alt-dark`
- `text-foreground dark:text-foreground-dark`
- `text-accent dark:text-accent-dark`
- `border-border dark:border-border-dark`

Chỉ nên thêm hardcoded color mới khi:
- đó là hiệu ứng trình bày rất cục bộ cho một flow cụ thể
- hoặc token hiện có không diễn đạt đúng semantic/visual intent
