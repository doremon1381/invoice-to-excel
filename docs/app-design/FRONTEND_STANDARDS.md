# ChargePlug EndUser Frontend Standards

Updated: 2026-03-27

This document defines the current frontend standards for `ChargePlug_user` based on the code that actually exists today. It replaces older guidance that referenced an outdated palette, theme system, and file structure.

## 1. Purpose

Goals:

1. Keep the app consistent across mobile and web.
2. Make large screens easier to maintain by splitting UI, hooks, and side effects clearly.
3. Keep styling token-driven and dark-mode safe.
4. Make async flows predictable for auth, plans, stations, topup, and live charging state.

Current stack:

- Expo Router
- React Native + React 19
- NativeWind v4 + Tailwind CSS v3
- Expo SDK 54
- Zustand for live/session stores
- SignalR + MQTT integrations for realtime flows

Source of truth for visual tokens:

- `styles/tokens.shared.js`
- `styles/tokens.ts`
- `styles/typography.shared.js`
- `styles/typography.ts`
- `tailwind.config.js`
- `COLOR_SUMMARY.md`
- `Palettecolor.md`

## 2. Folder Responsibilities

Use the current repo structure as-is:

```text
app/                 Expo Router route files and route wrappers
screen/              Large screen implementations used by route wrappers
components/          Reusable UI and feature sections
  ui/                Primitive building blocks
  shared/            Cross-feature UI patterns
  dashboard/
  plans/
  stations/
  account/
hooks/               Feature hooks and refresh orchestration
contexts/            App-wide providers and cross-cutting state
services/            Platform integrations, auth, notifications, MQTT, stores
services/store/      Zustand stores
utils/               Pure helpers and API clients
styles/              Theme tokens, typography, Tailwind entry
constants/           Static config, i18n, mock data, domain types
tests/               Targeted tests for pure logic
```

Rules:

1. Route files stay in `app/`.
2. If a route becomes large or state-heavy, move the implementation into `screen/` and keep the route file thin.
3. Reusable UI belongs in `components/`, not in `app/`.
4. Shared behavior belongs in hooks, contexts, services, or utils depending on ownership.

Examples:

```tsx
// Good: thin route wrapper
// app/stations/[id].tsx
import { StationDetailScreen } from '@/screen/StationDetailScreen';
```

```tsx
// Good: large implementation outside the route layer
// screen/StationDetailScreen.tsx
export function StationDetailScreen() {}
```

## 3. Naming and File Conventions

Rules:

1. Components use `PascalCase`.
2. Hooks use `camelCase` and start with `use`.
3. Utils use `camelCase`.
4. Route group folders use Expo Router naming such as `(tabs)` and `(auth)`.
5. File names should match the exported component or purpose.

Examples:

- `components/ui/Typography.tsx`
- `components/stations/station-card.tsx`
- `hooks/plans/useSessionActions.ts`
- `services/store/charging-session-store.ts`

Use the existing naming style consistently:

- Primitive reusable components are often `PascalCase` files.
- Feature-specific presentational pieces may be `kebab-case` files.
- Do not rename existing patterns casually unless doing a deliberate cleanup pass.

## 4. State Ownership

Use the narrowest state owner that matches the data:

### Local component state

Use `useState` for:

- open/closed UI
- input values
- local modal visibility
- temporary screen-only status

### Contexts

Current app-wide state lives in contexts:

- `AppSettingsProvider`
  - theme
  - language
  - `t()` translation helper
- `AuthProvider`
  - tokens
  - user
  - auth lifecycle
  - account refresh coordination
- `WalletProvider`
  - balance
  - transactions
  - charging plans
  - topup success notices
- `DeviceLiveProvider`
  - lifecycle bridge for live device connectivity

### Zustand stores

Use Zustand for shared, fast-changing, cross-screen app state:

- `device-live-store`
- `charging-session-store`
- `scanned-socket-store`
- `visitor-purchase-store`

Do not move auth or wallet domain state into random local component state.

## 5. Data and Side Effect Placement

Keep responsibilities split like this:

- `utils/`
  - API clients
  - pure formatters
  - validation
  - document normalization
- `services/`
  - auth integration
  - notifications
  - secure storage
  - MQTT / realtime plumbing
- `hooks/`
  - feature orchestration
  - screen refresh logic
  - derived UI state from multiple sources
- `components/`
  - render and interaction only

Rules:

1. Screens should not directly own every async workflow if that logic can live in a hook.
2. Pure helpers go in `utils/`, not inside render files.
3. Async effects should use an abort signal, cancellation flag, or generation guard when stale responses could corrupt UI state.
4. If multiple screens need the same refresh behavior, use a shared hook such as `useFocusedRefresh`.

## 6. Styling System

The codebase is Tailwind-first, not Tailwind-only.

### Default rule

Use NativeWind classes for most styling:

- layout
- spacing
- border radius
- colors from tokens
- standard text styling

Example:

```tsx
<View className="rounded-3xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark" />
```

### When `StyleSheet` or inline style is correct

Use `StyleSheet.create` or inline `style` when values are runtime-dependent or unsupported cleanly by class names:

- absolute positioning from measurements
- shadows and elevation
- SVG geometry
- camera overlays
- gradient bounds
- animation transforms
- dynamic widths/heights
- runtime colors for `ActivityIndicator`, placeholder text, icons, shadows, gradients

This is already the app pattern in:

- `app/_layout.tsx`
- `app/(tabs)/_layout.tsx`
- `components/shared/pull-to-refresh-scroll-view.tsx`
- `components/dashboard/SessionRatingPopover.tsx`
- `components/stations/sort-dropdown.tsx`

Rule:

1. Prefer classes first.
2. Use runtime styles when they make the code simpler or are required.
3. Do not force everything into arbitrary class strings.

## 7. Theme and Color Rules

Theme is controlled by `useAppSettings()` and synced to NativeWind with `setColorScheme()`.

Use:

```ts
const { theme, t } = useAppSettings();
const palette = colors[theme];
```

### Use semantic tokens, not random raw colors

Preferred class tokens:

- `bg-background dark:bg-background-dark`
- `bg-surface dark:bg-surface-dark`
- `bg-surface-alt dark:bg-surface-alt-dark`
- `text-foreground dark:text-foreground-dark`
- `text-muted dark:text-muted-dark`
- `text-muted-light dark:text-muted-light-dark`
- `text-accent dark:text-accent-dark`
- `border-border dark:border-border-dark`
- `bg-accent dark:bg-accent-dark`
- `text-on-accent`

Use runtime palette tokens for:

- `placeholderTextColor`
- `ActivityIndicator`
- `LinearGradient`
- `Svg`
- `shadowColor`
- platform-only or computed styles

If a raw color repeats across multiple files and represents a reusable semantic concept, promote it into `styles/tokens.shared.js`.

If it is a very local visual effect, keeping it local is acceptable. The station cards and scanner overlays already do this.

## 8. Typography Rules

All user-facing text should use `Typography` unless there is a hard technical reason to render raw `Text`.

Current variants:

- `heading`
- `body`
- `caption`
- `overline`

Current typography tokens:

- `xs`
- `sm`
- `base`
- `xl`

Variant mapping comes from `styles/typography.shared.js`.

Rules:

1. Use `Typography` for consistency.
2. Let `Typography` provide the default foreground color unless you need an explicit semantic text color.
3. Use semantic text classes such as `text-accent`, `text-danger`, `text-success`, `text-muted`.
4. Avoid ad-hoc font sizes and raw hex colors in text.

## 9. Shared Primitives You Should Reuse

Use the existing building blocks before creating new ones.

### UI primitives

- `Typography`
- `IconSymbol`
- `FormField`
- `KeyboardSafeTextInput`
- `GuardedPressable`

### Shared layout / interaction helpers

- `KeyboardSafeContainer`
- `PullToRefreshScrollView`
- `PageTitle`
- `IconSectionTitle`
- `FeatureLock`
- `UpgradeAccountModal`
- `GradientBackground`

Guidance:

1. Use `GuardedPressable` for async actions that can double-submit.
2. Use plain `Pressable` for simple navigation or lightweight taps.
3. Use `KeyboardSafeContainer` for form-heavy screens and modals with inputs.
4. Use `PullToRefreshScrollView` for refreshable tab screens instead of re-implementing refresh behavior.
5. Use `FeatureLock` for visitor gating and locked features instead of hand-rolling overlays.

## 10. Screen Composition Patterns

### Tab screens

Most main screens follow this pattern:

- root `View className="flex-1"`
- `PullToRefreshScrollView`
- content container classes like `px-5 pt-5 pb-24 gap-4`
- `PageTitle` or `IconSectionTitle`

### Auth and upgrade forms

Use:

- `KeyboardSafeContainer`
- `FormField`
- `GuardedPressable`
- token-based placeholders and button colors

### Large route wrappers

If the route is mostly a shell, keep it in `app/` and render the real screen from `screen/`.

This pattern is already used for:

- `app/stations/[id].tsx`
- `app/topup/vietqr.tsx`

### Modals and overlays

Current modal pattern:

1. `Modal` with `transparent` and `statusBarTranslucent`
2. outer `Pressable` scrim
3. inner `Pressable` or `View` for the content panel
4. token-driven surface, border, and text colors

## 11. Lists and Performance

Do not blindly prefer `FlatList`.

Current app reality:

- Many screens render short or medium sectioned content with `ScrollView`
- This is acceptable for the current data size and layout composition

Use `FlatList` or `SectionList` only when:

- the list is genuinely long
- virtualization matters
- item recycling improves performance measurably

Use `useMemo` and `useCallback` when they improve clarity or stabilize props passed to child components and hooks. Do not wrap everything by default.

Good current examples:

- derived stat themes
- refresh callbacks
- anchored popover positioning
- scan payload parsing helpers

## 12. Async UX Standards

Rules:

1. Show loading states for long-running work.
2. Prevent duplicate submissions for purchase, login, register, upgrade, and rating flows.
3. Surface recoverable errors inline when possible.
4. Retry auth-sensitive requests carefully when token refresh races are possible.
5. Keep optimistic updates scoped and reversible when the server remains source of truth.

Current examples:

- `GuardedPressable` for async actions
- auth refresh mutex in `contexts/auth.tsx`
- optimistic wallet updates in `contexts/wallet.tsx`
- polling + SignalR fallback in `screen/TopUpVietQR.tsx`

## 13. Accessibility and i18n

All user-facing copy should come from translations:

```ts
const { t } = useAppSettings();
```

Rules:

1. Do not hardcode user-visible strings unless they are purely technical placeholders internal to the component.
2. Add `accessibilityRole`, `accessibilityLabel`, and `accessibilityHint` for interactive controls when meaning is not obvious.
3. Format currency, dates, countdowns, and locale-dependent values explicitly.
4. Keep copy compatible with both `vi` and `en`.

## 14. Comments and File Documentation

The repo already uses lightweight JSDoc and section dividers in larger files. Keep that style.

Rules:

1. Add short JSDoc comments for exported hooks, providers, and non-obvious components.
2. Use comments to explain intent, not trivial syntax.
3. In very large files, section dividers are acceptable if they improve scanability.
4. Avoid noisy comments that restate the code.

## 15. What Not To Reintroduce

Do not add new standards that conflict with the current app:

1. Do not reference removed files such as `constants/theme.ts`, `components/themed-text.tsx`, `components/themed-view.tsx`, or `hooks/use-theme-color.ts`.
2. Do not document the old teal palette.
3. Do not claim `StyleSheet` is banned. It is allowed where runtime styling is needed.
4. Do not force `FlatList` for short compositional screens.
5. Do not put reusable shared UI directly under `app/`.

## 16. Recommended Default Patterns

When creating a new feature:

1. Put route entry in `app/`.
2. If the route gets large, move the implementation into `screen/` or feature components.
3. Keep API and pure data transforms in `utils/` or `services/`.
4. Use `Typography`, `IconSymbol`, token classes, and `colors[theme]`.
5. Use `KeyboardSafeContainer` for forms and `PullToRefreshScrollView` for refreshable content screens.
6. Reuse `FeatureLock` for visitor gating.
7. Keep light and dark mode correct from the first commit.

## 17. Quick Checklist

Before merging frontend work, verify:

- route file is thin enough
- shared pieces extracted out of `app/`
- all text uses `Typography`
- colors come from semantic tokens or justified local overrides
- dark mode works
- loading, empty, and error states exist where needed
- async buttons cannot double-submit
- user-facing strings use `t()`
- accessibility labels are present for non-obvious controls
- runtime styles are used only where classes are not enough
