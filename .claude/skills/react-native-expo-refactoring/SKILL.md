---
name: react-native-expo-refactoring
description: Refactor React Native Expo code using clean code principles, maintainable component/service boundaries, and disciplined comment conventions. Use when improving readability, structure, naming, duplication, or code health without changing intended behavior.
origin: custom
---

# React Native Expo Refactoring

Use this skill when the goal is to improve code quality in a React Native Expo project without adding unrelated features.

This skill is specifically for:
- cleaning up screens, components, hooks, and services
- reducing duplication
- improving naming and file structure
- simplifying state and side effects
- enforcing useful comment conventions
- preserving behavior while making the code easier to read, test, and extend

## Primary Goal

Make the codebase easier to understand and safer to change.

Refactoring should improve clarity and maintainability first. Do not introduce architectural churn, speculative abstractions, or cosmetic rewrites with no payoff.

## Core Rules

1. Preserve behavior unless the task explicitly asks for functional changes.
2. Prefer small, local improvements over wide rewrites.
3. Remove accidental complexity before adding abstraction.
4. Keep React Native and Expo constraints in mind.
5. Refactor for the current product needs, not hypothetical future reuse.
6. Comments must explain intent or non-obvious constraints, not restate the code.

## Clean Code Principles

Apply these principles during refactoring:

### 1. Naming
- Use names that reveal intent.
- Prefer domain language over vague names like `data`, `item`, `value`, `helper`, `stuff`, `handleThing`.
- Component names should describe what they render or orchestrate.
- Hook names should start with `use` and describe the stateful concern.
- Service and utility names should reflect their single responsibility.
- Avoid misleading abbreviations unless they are standard in the project domain.

### 2. Single Responsibility
- A screen should coordinate a user flow, not contain every implementation detail.
- A component should render one coherent UI responsibility.
- A hook should encapsulate one stateful behavior or workflow.
- A service should handle one external or processing concern.
- Utility functions should be pure when possible and narrowly scoped.

### 3. Function Design
- Keep functions focused and short when practical.
- Extract repeated logic only when the extracted unit has a clear meaning.
- Avoid long parameter lists; prefer a typed object when parameters form one concept.
- Prefer early returns to reduce nesting.
- Replace boolean flag arguments with clearer separate functions or typed options when useful.

### 4. State Management
- Keep state as local as possible.
- Do not lift state unless multiple consumers truly need it.
- Derive values instead of storing duplicate state.
- Avoid effect-driven state synchronization when direct derivation is sufficient.
- Keep transient UI state separate from domain processing state.

### 5. Side Effects
- Isolate filesystem, network, parsing, and device interactions from rendering code.
- Keep `useEffect` focused and minimal.
- Do not put complex business logic directly inside component effects.
- Move reusable side-effect orchestration into hooks or services.

### 6. Component Structure
- Split oversized components when they mix layout, business rules, and side effects.
- Prefer composition over deeply configurable mega-components.
- Keep presentational concerns separate from processing logic where it improves readability.
- Avoid prop drilling if a simpler local composition or targeted context solves it cleanly.

### 7. Error Handling
- Handle real user-facing failure points clearly.
- Do not add defensive noise for impossible internal states.
- Normalize errors at boundaries such as file picking, PDF parsing, storage, and export.
- Surface actionable messages for users and clean error objects for code.

### 8. Duplication
- Remove true duplication in logic, not just repeated syntax.
- Do not create abstractions for two or three lines unless the new abstraction is clearer.
- Prefer explicit code over generic wrappers when the workflow is unique.

## React Native Expo Refactoring Guidance

### Screens
- Keep screens focused on flow orchestration, user actions, and high-level state wiring.
- Move parsing, export, and formatting logic out of screens into hooks or services.
- Avoid large inline render branches; extract meaningful subcomponents when they help.

### Components
- Keep UI components predictable and props explicit.
- Prefer controlled components for form-like behavior when clarity improves.
- Avoid hiding critical behavior in deeply nested anonymous callbacks.

### Hooks
- Use hooks for stateful workflows such as file selection, processing progress, export status, or chunk preview generation.
- Hooks should return a clear API: state, derived values, and user actions.
- Avoid hooks that know too much about unrelated concerns.

### Services
- Put PDF parsing, markdown generation, slug creation, chapter detection, manifest writing, and export behavior into service modules.
- Keep services framework-light where possible so they are easier to test.
- Separate pure transformation logic from device-specific I/O.

### Types
- Prefer explicit TypeScript types for chunk models, manifest entries, export options, and processing results.
- Use discriminated unions for mode-specific behavior such as `chapter`, `pageCount`, and `manualRange` strategies.
- Avoid `any` unless unavoidable and tightly contained.

## Comment Convention

Comments are allowed, but they must be purposeful.

### Good comments
Use comments for:
- explaining why a non-obvious decision exists
- documenting Expo or platform limitations
- clarifying tricky sequencing or async constraints
- warning about assumptions at system boundaries
- describing intentional tradeoffs or fallback behavior

Examples:
- why a PDF extraction path uses a fallback strategy in Expo managed workflow
- why image extraction must be deferred to a native-compatible layer
- why text normalization intentionally preserves some heading patterns

### Bad comments
Do not write comments that:
- narrate obvious code
- restate a function name
- describe trivial assignments
- leave stale TODO-style noise without context
- apologize for code

Avoid this:
```ts
// Set loading to true
setLoading(true);
```

Prefer this only when needed:
```ts
// Expo-managed builds cannot access this native PDF capability, so we fall back
// to text-only extraction and keep image references empty for this export.
```

## Refactoring Checklist

Before refactoring:
- identify the behavior that must remain unchanged
- identify the main pain points: naming, duplication, oversized files, tangled state, unclear boundaries
- verify existing patterns in the project before introducing new ones

During refactoring:
- make one coherent improvement at a time
- keep diffs reviewable
- update types as structure becomes clearer
- keep UI behavior stable
- preserve user-visible strings unless asked to change them

After refactoring:
- remove dead code and unused imports
- verify file boundaries still make sense
- ensure comments are still accurate
- run relevant tests or checks if available
- confirm no accidental behavior changes were introduced

## Preferred Patterns for This Kind of Project

For a React Native Expo PDF-to-Markdown app, usually prefer:
- screens for flow orchestration
- hooks for selection, processing, and export workflows
- services for PDF parsing, chunking, markdown generation, manifest building, and file export
- utility functions for pure helpers like slugging, page range formatting, and normalization
- focused presentational components for previews, progress display, and configuration controls

## Avoid These Refactoring Mistakes

- turning every repeated line into a shared helper
- moving logic across too many files without increasing clarity
- introducing generic repositories/managers/factories without real need
- embedding business logic inside JSX trees
- using comments to patch over unclear names or structure
- replacing simple explicit code with clever indirection
- adding feature flags or compatibility layers that were not requested

## Output Standard

When applying this skill:
1. Identify what is hard to read or maintain.
2. Explain the refactoring direction briefly.
3. Make focused changes that preserve behavior.
4. Use comments only where intent or constraints are not obvious.
5. Keep the final code simpler than before.

## Success Criteria

A successful refactor should result in code that:
- is easier to navigate
- uses clearer names
- has better separation of concerns
- contains fewer tangled effects and oversized components
- follows React Native Expo-friendly boundaries
- uses comments sparingly and meaningfully
- is easier for another developer to extend safely
