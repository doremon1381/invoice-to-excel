# React Native Frontend Standards Template

Updated: 2026-04-20

This document is a reusable frontend standards template for React Native applications. Adapt the folder names, libraries, and examples to match your project, but keep the underlying architectural rules consistent.

## 1. Purpose

Goals:

1. Keep the UI consistent across screens and features.
2. Make large screens easier to maintain by separating rendering, orchestration, and side effects.
3. Keep styling token-driven and safe for light and dark mode.
4. Make asynchronous workflows predictable and easy to review.
5. Provide a baseline that can work with Expo or bare React Native projects.

This template intentionally avoids assuming a specific navigation library, styling system, state library, or backend integration.

## 2. Folder Responsibilities

Use a structure that makes ownership obvious. Teams may choose different folder names, but responsibilities should stay clear.

```text
src/
  app/ or routes/        Route entries or navigation wiring
  screens/               Screen-level implementations
  features/              Feature-specific UI, hooks, and logic
  components/            Reusable cross-feature UI
    ui/                  Primitive building blocks
    shared/              Shared patterns used by multiple features
  hooks/                 Reusable hooks and orchestration helpers
  contexts/              App-wide providers and global state bridges
  services/              Platform or backend integrations
  stores/                Shared client state when a store library is used
  utils/                 Pure helpers, formatters, and validation
  styles/                Design tokens, typography, theme helpers
  constants/             Static configuration and shared constants
  tests/                 Targeted tests for pure logic and utilities
```

Rules:

1. Keep route or navigation entry files thin.
2. Move large screen implementations out of route files and into `screens/` or `features/`.
3. Put reusable UI in shared component folders, not inside navigation entry points.
4. Put shared behavior in hooks, services, stores, or utils based on ownership.
5. Keep feature-specific code close together when it improves discoverability.

Example:

```tsx
// Good: thin route entry
import { ProfileScreen } from '@/screens/ProfileScreen';

export default function ProfileRoute() {
  return <ProfileScreen />;
}
```

## 3. Naming and File Conventions

Rules:

1. Components use `PascalCase`.
2. Hooks use `camelCase` and begin with `use`.
3. Utilities use `camelCase` and reflect their purpose clearly.
4. Feature folders use stable, descriptive names.
5. File names should match the exported component, hook, or module purpose.

Examples:

- `components/ui/Button.tsx`
- `components/shared/EmptyState.tsx`
- `features/auth/useLoginForm.ts`
- `services/apiClient.ts`
- `utils/formatCurrency.ts`

Apply naming rules consistently. Consistency matters more than the exact folder labels.

## 4. State Ownership

Use the narrowest state owner that matches the data.

### Local component state

Use local state for:

- open or closed UI state
- input values
- temporary loading indicators
- local modal visibility
- short-lived screen-only status

### Contexts or app-wide providers

Use app-wide providers for data shared across large parts of the app, such as:

- theme
- locale
- authenticated user session
- permissions state
- app configuration

### Shared stores

If the app uses a store library, reserve it for shared state that changes frequently across screens, such as:

- live device status
- active workflow/session state
- cross-screen filters
- cached interaction state that does not belong to a single component tree

Rules:

1. Do not lift state higher than necessary.
2. Do not hide local UI state in a global store without a clear reason.
3. Keep server data ownership distinct from purely client-side UI state.
4. If a state value crosses many screens or providers, document its owner clearly.

## 5. Data and Side Effect Placement

Keep responsibilities split by intent:

- `utils/`
  - pure formatting
  - validation
  - parsing
  - transformation helpers
- `services/`
  - API clients
  - storage adapters
  - device integrations
  - notifications
  - analytics bridges
- `hooks/`
  - screen orchestration
  - multi-source derived state
  - reusable async workflows
- `components/`
  - rendering and interaction

Rules:

1. Screens should not own every asynchronous workflow if the logic can be extracted into a hook or service.
2. Pure helpers should stay outside render files.
3. Async effects should use cancellation, abort signals, or stale-result guards when race conditions can corrupt UI state.
4. When multiple screens need the same orchestration logic, extract a shared hook.

## 6. Styling System

Use a design-token approach regardless of whether the app uses `StyleSheet`, utility classes, styled components, or another styling system.

### Default rule

Prefer styles that clearly express:

- layout
- spacing
- typography
- color roles
- radius and borders

Use semantic tokens instead of raw color literals for shared UI.

Example:

```tsx
<View style={styles.card} />
```

```ts
const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.surface,
    borderColor: tokens.color.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
});
```

### When runtime styling is appropriate

Use runtime or inline styles when values depend on measurements, animation, or platform APIs, such as:

- dynamic widths and heights
- absolute positioning from layout measurements
- gradients
- shadows and elevation
- SVG drawing
- animation transforms
- runtime indicator colors

Rules:

1. Prefer the simplest style expression that stays readable.
2. Use design tokens for shared visual meaning.
3. Do not force every runtime value into a static token.
4. If a raw style value repeats and carries semantic meaning, promote it into the token system.

## 7. Theme and Color Rules

Support light and dark mode from the start when the product needs both.

Use semantic tokens for roles such as:

- background
- surface
- surface-alt
- foreground
- muted text
- border
- accent
- success
- warning
- danger
- on-accent text

Rules:

1. Prefer semantic tokens over raw hex values.
2. Keep contrast acceptable in both light and dark themes.
3. Use one consistent source of truth for color roles.
4. If a local visual effect is intentionally one-off, keep it local and document why if needed.

## 8. Typography Rules

This app uses **NativeWind / Tailwind `text-*` utilities** backed by a single pixel scale. Do not introduce raw `fontSize: <number>` in components except where the platform API cannot take classes (e.g. React Navigation `headerTitleStyle`, or `TextInput` when `className` is unreliable—use `Typography` from `@/constants/typography` there).

### Source of truth

- Scale values: [`constants/typography.tokens.json`](../../constants/typography.tokens.json) (size + lineHeight per token).
- Typed access: [`constants/typography.ts`](../../constants/typography.ts) exports `Typography` (e.g. `Typography.base.size`).
- Tailwind names: [`tailwind.config.js`](../../tailwind.config.js) `theme.extend.fontSize` mirrors the JSON so classes like `text-caption` match the same numbers.

### Token → class mapping

| Class | Size (px) | Typical use |
| --- | --- | --- |
| `text-2xs` | 10 | Fine print / code snippets |
| `text-tiny` | 11 | Compact labels |
| `text-xs` | 12 | Badges, meta, overline-style |
| `text-caption` | 13 | Secondary body, table cells |
| `text-sm` | 14 | Supporting text |
| `text-md` | 15 | Emphasized small UI |
| `text-base` | 16 | Default body |
| `text-lead` | 17 | Slightly larger emphasis |
| `text-xl` | 20 | Section headings, nav titles |
| `text-display` | 28 | Stats / hero numbers |
| `text-display-lg` | 32 | Screen titles (`ThemedText` display/title) |

### `ThemedText`

Use [`components/shared/themed-text.tsx`](../../components/shared/themed-text.tsx) `type` for semantic presets (`body`, `heading`, `caption`, …). Use **`type="custom"`** whenever you set your own `text-*` size on `className` (otherwise the default preset adds `text-base` and conflicts). Same pattern for stats: `type="custom"` + `className="text-display font-bold"`.

### Rules

1. Prefer `className="text-<token>"` on `Text` / `ThemedText` over inline font size.
2. Avoid new arbitrary pixel sizes; extend `typography.tokens.json` + Tailwind if a new step is truly needed.
3. Prefer semantic `ThemedText` `type` or the table above over one-off combinations.
4. Keep readable line height: tokens include `lineHeight`; do not strip it without reason.

## 9. Shared Primitives You Should Reuse

Establish a small set of reusable primitives before building feature-specific UI.

Examples:

- `Button`
- `Text`
- `TextField`
- `Card`
- `Icon`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `ScreenContainer`
- `SectionTitle`

Guidance:

1. Reuse primitives before creating one-off variants.
2. Keep primitives flexible, but do not over-generalize them.
3. Use feature-level wrappers when a primitive alone is not enough.
4. Shared interaction patterns should feel consistent across the app.

## 10. Screen Composition Patterns

### Standard screens

Most screens should follow a predictable structure:

- root container
- page title or screen header
- content area
- loading, empty, and error states where needed
- safe handling of scrolling and keyboard overlap

### Forms

Use a consistent form structure:

- grouped fields
- inline validation where appropriate
- primary and secondary actions
- keyboard-safe container behavior
- duplicate-submit protection for async actions

### Modals and overlays

Common modal pattern:

1. scrim or backdrop
2. content panel
3. explicit close behavior
4. accessible focus and labeling
5. token-driven surface and text colors

## 11. Lists and Performance

Choose the simplest list rendering approach that fits the data size.

Rules:

1. Use a basic scroll container for short compositional content.
2. Use virtualized lists when item count or memory usage requires it.
3. Memoize expensive derived values or callbacks when it improves clarity or stability.
4. Do not add memoization everywhere by default.
5. Measure performance issues before introducing complexity.

## 12. Async UX Standards

Rules:

1. Show loading states for long-running work.
2. Prevent duplicate submissions for async actions.
3. Surface recoverable errors close to the relevant UI.
4. Keep optimistic updates reversible when the server remains the source of truth.
5. Make retry behavior deliberate rather than automatic guesswork.

## 13. Accessibility and i18n

Rules:

1. Do not hardcode user-facing strings if the app supports localization.
2. Add accessibility labels, roles, and hints for controls when meaning is not obvious.
3. Format dates, currency, and numbers using locale-aware utilities.
4. Keep color usage accessible; do not rely on color alone to convey status.
5. Ensure tap targets and focus behavior are usable on mobile devices.

## 14. Comments and File Documentation

Rules:

1. Add short comments for non-obvious intent, not for trivial syntax.
2. Use lightweight file or section documentation in large modules when it improves scanability.
3. Keep exported APIs understandable without excessive comments.
4. Avoid noisy comments that restate the code.

## 15. Recommended Default Patterns

When creating a new feature:

1. Add the route or navigation entry.
2. Keep the screen implementation outside the routing layer if it grows.
3. Put pure transformations in utilities.
4. Put integrations and side effects in services or orchestration hooks.
5. Reuse shared typography, inputs, buttons, and containers.
6. Keep theme support, loading states, and accessibility correct from the first implementation.

## 16. Quick Review Checklist

Before merging frontend work, verify:

- route or navigation entry is thin enough
- shared pieces are extracted out of screen files where reuse is real
- colors come from semantic tokens or justified local overrides
- typography stays consistent
- light and dark mode work as intended
- loading, empty, and error states exist where needed
- async actions cannot double-submit
- user-facing strings follow the project localization strategy
- accessibility labels are present for non-obvious controls
- runtime styles are used only where static styles are not enough
