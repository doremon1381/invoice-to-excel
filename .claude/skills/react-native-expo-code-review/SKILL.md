---
name: react-native-expo-code-review
description: Review React Native Expo code for clean code quality, maintainability, refactoring opportunities, and proper comment usage. Use when auditing screens, components, hooks, services, or utilities before or after implementation.
origin: custom
---

# React Native Expo Code Review

Use this skill to review a React Native Expo codebase with a strict focus on code quality, maintainability, clean structure, and disciplined comments.

This skill is meant to complement `react-native-expo-refactoring`.
It identifies what should change before refactoring begins, or verifies whether a refactor actually improved the code.

## Primary Goal

Find issues that make the code harder to understand, harder to test, or harder to extend.

Prioritize high-signal review feedback over generic style commentary.
Do not nitpick cosmetic issues unless they affect readability or maintenance.

## Review Scope

Review code in these areas:
- screens
- components
- hooks
- services
- utils
- types
- filesystem or export logic
- PDF processing and chunking logic
- async flows and effect usage

## Review Priorities

Order findings by importance:
1. behavior and architectural problems
2. separation of concerns
3. state and side-effect complexity
4. readability and naming
5. duplication and abstraction quality
6. comments and documentation quality
7. minor consistency issues

## What Good Code Looks Like

Good React Native Expo code should usually have:
- screens that orchestrate flows instead of owning all logic
- components with one coherent rendering responsibility
- hooks that encapsulate one stateful workflow
- services for parsing, export, storage, and transformation logic
- explicit TypeScript models for domain objects
- small, understandable functions
- minimal effect complexity
- comments only where intent or constraints are non-obvious

## Review Checklist

### 1. Naming
Check whether names reveal intent.

Flag:
- vague names like `data`, `result`, `temp`, `helper`, `utils`, `thing`
- misleading names that no longer match behavior
- components or hooks whose names do not match their responsibility

Approve when:
- names align with domain concepts such as chunk, chapter, export, manifest, page range, processing state

### 2. File and Module Boundaries
Check whether responsibilities are in the right place.

Flag:
- screens doing parsing or export work directly
- components containing heavy business logic
- hooks mixing unrelated concerns
- services depending too heavily on UI state or JSX concepts

Approve when:
- rendering, orchestration, pure transformation, and device I/O are reasonably separated

### 3. Function Quality
Check whether functions are focused and readable.

Flag:
- long functions with mixed concerns
- deep nesting that could be flattened with early returns
- boolean flag parameters that obscure intent
- repeated code that should be extracted into a meaningful unit

Approve when:
- each function has one clear job
- extraction improves clarity instead of creating indirection

### 4. State Management
Check whether state is minimal and correctly placed.

Flag:
- duplicated derived state
- state lifted too high without need
- effect-driven synchronization where simple derivation would work
- unrelated state bundled into one object without benefit

Approve when:
- state is local where possible
- derived values are computed instead of stored
- UI state and domain processing state are clearly separated

### 5. Effects and Async Logic
Check whether side effects are contained.

Flag:
- oversized `useEffect` blocks
- business rules embedded directly in effects
- race-prone async flows without clear ownership
- render code tightly coupled to storage or PDF parsing side effects

Approve when:
- effects are small and intentional
- async workflows are isolated in hooks or services

### 6. Duplication and Abstractions
Check whether the code is either too repetitive or too abstract.

Flag:
- copy-pasted logic with the same meaning
- generic wrappers that hide simple logic
- premature abstractions not justified by current needs

Approve when:
- repeated logic is consolidated only where the extracted concept is real
- explicit code remains explicit when it is easier to understand

### 7. TypeScript Quality
Check whether types support safe evolution.

Flag:
- overuse of `any`
- implicit untyped data flowing through core logic
- weakly modeled mode-specific behavior

Approve when:
- domain models are explicit
- unions are used where strategy modes differ
- service inputs and outputs are clearly typed

### 8. Comment Quality
Comments should explain intent, tradeoffs, or constraints.

Flag:
- comments that repeat obvious code
- stale comments that do not match behavior
- noisy section headers with no value
- TODO comments without context or owner
- comments used to compensate for poor naming

Approve when:
- comments explain Expo limitations, platform behavior, fallback strategies, or non-obvious invariants
- comments are sparse and high-value

### 9. React Native Expo Fit
Check whether the implementation respects Expo realities.

Flag:
- Node-only assumptions in runtime code
- PDF or filesystem logic that ignores mobile platform constraints
- architecture that would only work in web or server environments

Approve when:
- code acknowledges Expo-managed vs native limitations clearly
- platform-specific constraints are handled at the right boundary

### 10. User-Facing Error Handling
Check whether real failures are handled well.

Flag:
- raw internal errors surfacing to users
- unclear export or file-picker failure states
- excessive defensive checks for impossible internal conditions

Approve when:
- boundary failures have actionable messages
- internal code stays clean and not overly defensive

## Comment Standard

Use this standard when reviewing comments:

### Acceptable comments
- explain why a workaround exists
- clarify a platform limitation
- document a non-obvious assumption
- describe an intentional fallback path

### Unacceptable comments
- describe obvious statements
- narrate control flow line by line
- add filler headings like `// Handle button press`
- preserve outdated implementation history

## Review Output Format

When using this skill, produce findings in this format:

### Summary
- 2-5 bullets on the biggest quality issues or confirmation that the structure is sound

### Findings
For each finding include:
- severity: `high`, `medium`, or `low`
- location: `file_path:line_number`
- issue: what is wrong
- why it matters: maintainability/readability/correctness impact
- recommendation: concrete refactor or rewrite direction

### Comment Audit
- list comments that should be removed
- list comments that are justified and should stay
- identify places where a comment is missing because a platform constraint or tradeoff is non-obvious

### Refactoring Priorities
- recommend the top 3-5 fixes in the order they should be addressed

## Review Principles

- Be strict but practical.
- Prefer fewer high-value findings over many weak ones.
- Do not recommend large rewrites without a clear payoff.
- Do not push abstractions unless they simplify the current code.
- Assume the goal is maintainable product code, not pattern maximalism.

## Success Criteria

A strong review should:
- identify the main maintainability risks quickly
- point to exact files and lines
- distinguish structural issues from minor cleanup
- improve comment discipline
- guide a refactor that preserves behavior while simplifying the codebase
