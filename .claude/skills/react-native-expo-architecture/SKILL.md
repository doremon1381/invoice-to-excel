---
name: react-native-expo-architecture
description: Design React Native Expo app architecture with clear boundaries for screens, components, hooks, services, types, and utilities. Use when planning or restructuring app structure before implementation or large refactors.
origin: custom
---

# React Native Expo Architecture

Use this skill when deciding how a React Native Expo project should be structured before implementation, or when the current structure has become hard to scale.

This skill is for making practical architectural decisions, not for introducing unnecessary patterns.

It complements:
- `react-native-expo-refactoring` for improving existing code
- `react-native-expo-code-review` for auditing existing code quality

## Primary Goal

Create an architecture that is easy to understand, easy to extend, and appropriate for a React Native Expo app.

Good architecture should:
- make ownership of code obvious
- keep UI concerns separate from processing and I/O
- reduce accidental coupling
- support safe iteration
- stay lightweight enough for the actual project size

## Core Principles

1. Choose the simplest structure that cleanly supports current requirements.
2. Separate rendering, stateful workflows, pure transformations, and device/external I/O.
3. Keep Expo and React Native platform constraints visible in the architecture.
4. Prefer explicit module boundaries over abstract generic layers.
5. Do not create enterprise-style architecture for a small or medium app.
6. Organize by responsibility and feature needs, not by fashion.

## What This Skill Should Decide

Use this skill to decide:
- folder structure
- what belongs in screens vs components
- what should become hooks
- what should become services
- where filesystem and PDF logic should live
- where types should live
- when utilities are justified
- how to model feature boundaries
- how to keep Expo-specific constraints isolated

## Architectural Layers

### 1. Screens
Screens should:
- orchestrate user flows
- connect user actions to stateful workflows
- compose components
- own route-level concerns

Screens should not:
- perform heavy parsing or export logic inline
- contain large amounts of transformation logic
- directly implement low-level filesystem behavior unless the app is extremely small

### 2. Components
Components should:
- render UI
- encapsulate local presentation logic
- receive clear props
- stay focused on one visible responsibility

Components should not:
- own unrelated business workflows
- hide important side effects in render callbacks
- become giant configurable containers for many unrelated use cases

### 3. Hooks
Hooks should:
- encapsulate one stateful workflow or behavior
- manage async process state
- expose a clear API of state, derived values, and actions

Good uses for hooks in an Expo app:
- file picking
- export progress tracking
- chunk preview generation
- processing lifecycle control
- permission-related state

Hooks should not:
- become a dumping ground for all app logic
- mix unrelated workflows such as file picking, parsing, analytics, and UI layout state in one hook

### 4. Services
Services should:
- contain non-UI logic
- isolate parsing, export, storage, normalization, chunking, manifest generation, and similar workflows
- be easier to test than screen code
- separate pure transformation logic from device I/O where useful

For this kind of project, likely services include:
- `pdfParser`
- `chapterDetector`
- `chunkBuilder`
- `markdownGenerator`
- `imageExporter`
- `manifestWriter`
- `exportCoordinator`

Services should not:
- depend on JSX or component lifecycle assumptions
- become generic catch-all managers

### 5. Utilities
Utilities should:
- stay small and focused
- handle pure helpers such as slug generation, range formatting, normalization helpers, or filename creation

Utilities should not:
- hide domain logic that deserves a named service
- become a broad `utils` graveyard with unrelated functions

### 6. Types
Types should:
- model the project domain clearly
- define contracts between screens, hooks, and services
- make strategy-specific behavior explicit

Prefer explicit types for:
- selected files
- page data
- chapter candidates
- chunk definitions
- export options
- manifest entries
- processing warnings and results

Use discriminated unions for mode-specific behavior when applicable, such as:
- `chapter`
- `pageCount`
- `manualRange`

## Recommended Structure Patterns

### Option A: Responsibility-based structure
Use this when the project is still moderate in size and responsibilities are clear.

```text
src/
  screens/
  components/
  hooks/
  services/
    pdf/
    chunking/
    markdown/
    export/
  types/
  utils/
```

Good for:
- focused apps
- teams that want predictable locations for common responsibilities
- projects where shared workflows matter more than many isolated features

### Option B: Feature-first with shared core
Use this when the app grows into several distinct user-facing flows.

```text
src/
  features/
    pdf-import/
    chunk-preview/
    export-output/
  shared/
    components/
    hooks/
    services/
    types/
    utils/
```

Good for:
- apps with multiple substantial flows
- teams that want feature-local ownership

### Recommendation rule
Prefer Option A first unless the app already has multiple distinct features that justify Option B.

For a React Native Expo PDF-to-Markdown app, Option A is usually the better default early on.

## Expo-Specific Architecture Guidance

Architecture should acknowledge these realities:
- filesystem access is a platform boundary
- document picking is a platform boundary
- PDF parsing may require native-compatible libraries or partial fallback behavior
- image extraction may not be equally supported across all Expo environments
- some capabilities may work only in development builds or prebuild/native paths

Keep these concerns isolated:
- document picker integration
- filesystem write/export logic
- native or semi-native PDF parsing adapters
- fallback logic for unsupported extraction modes

Do not spread Expo-specific conditionals across UI files if they can be centralized in service boundaries.

## Decision Rules

Use these rules when placing code:

### Put code in a screen when:
- it coordinates the user flow
- it wires actions to hooks/services
- it determines what sections of UI appear

### Put code in a component when:
- it renders a reusable or isolated UI unit
- it has small local interaction behavior
- extraction improves readability

### Put code in a hook when:
- it manages stateful workflow behavior
- it needs lifecycle-aware coordination
- multiple screen/component lines are obscuring the main flow

### Put code in a service when:
- it is not inherently visual
- it transforms data
- it handles parsing, exporting, storage, or other process logic
- it should be testable without rendering

### Put code in a utility when:
- it is a small pure helper
- it does not deserve domain-level ownership

## What to Avoid

Avoid these common architecture mistakes:
- oversized screen files that handle everything
- putting parsing and export logic directly in components
- generic `manager`, `controller`, or `processor` layers without clear responsibility
- a giant `utils` folder for unrelated business logic
- premature global state for local workflows
- context providers used only to avoid passing two or three props
- architecture copied from large web apps without adapting to Expo mobile constraints

## Architecture Review Questions

When using this skill, answer these questions:
1. What are the main user flows?
2. What responsibilities need to be isolated from UI?
3. Which parts are pure transformation vs platform I/O?
4. Which parts require React lifecycle or local state?
5. What folder structure best matches the actual scope?
6. Where will Expo-specific limitations be contained?
7. What should remain simple instead of abstracted?

## Output Format

When applying this skill, respond with:

### 1. Proposed structure
Show the recommended folder structure.

### 2. Responsibility map
List what belongs in:
- screens
- components
- hooks
- services
- types
- utils

### 3. Key boundaries
Explain the most important boundaries to preserve.

### 4. Tradeoffs
Call out what is intentionally not abstracted and why.

### 5. Implementation guidance
Give a short list of practical next steps for building or restructuring the app.

## Success Criteria

A strong architecture should:
- be understandable without extra explanation
- make file placement intuitive
- keep UI code lighter
- isolate device and PDF processing concerns
- fit React Native Expo constraints
- support future iteration without unnecessary abstraction
