# Source Layout

RetCon is organized by feature first, with shared UI and shared utilities kept
separate from game/build logic.

## Main Areas

- `features/`
  Feature-owned code. Components, hooks, and helpers that mostly belong to one
  domain should live here.
- `shared/`
  Generic UI and generic helpers that can be reused by multiple features.
- `components/`
  Application-level panels and dialogs that have not been moved into a feature
  yet. This folder should shrink over time.
- `hooks/`
  Cross-feature application state hooks. Feature-specific hooks should move
  into their feature folder when practical.
- `utils/`
  Core game/build logic that is still shared across multiple features.
- `types/`
  Shared TypeScript data shapes.

## Import Style

Prefer the `@/` alias instead of deep relative imports:

```ts
import { PowersPanel } from "@/features/powers";
import type { BuildSlot } from "@/types/builds";
```

Use feature `index.ts` files when importing from outside a feature. Inside a
feature, direct imports are fine when they make ownership clearer.

## Current Features

- `features/character`
  Character panel, stat/talent dialogs, and stat/talent state.
- `features/build`
  Build panel, build validation dialog, combat/auxiliary slot state, and build
  power targeting helpers.
- `features/powers`
  Powers panel, power/travel/device/advantage dialogs, and power panel targeting.
- `features/specializations`
  Specialization panel, specialization dialogs, and specialization rules/state.
- `features/import-build`
  HeroCreator/Aesica import UI and conversion logic.
- `features/saved-builds`
  My Builds data dialog and saved build storage hook/helpers.
