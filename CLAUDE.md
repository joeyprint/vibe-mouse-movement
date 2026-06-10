# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> **Read `AGENTS.md` first.** This project pins a modified Next.js (16.2.9) whose
> APIs and conventions may differ from training data. Consult
> `node_modules/next/dist/docs/` before writing framework code.

## Commands

Package manager is **pnpm** (see `pnpm-lock.yaml` / `pnpm-workspace.yaml`).

- `pnpm dev` — start dev server at http://localhost:3000
- `pnpm build` — production build
- `pnpm start` — serve the production build
- `pnpm lint` — run ESLint (flat config, `eslint.config.mjs`, extends `next/core-web-vitals` + `next/typescript`)

No test runner is configured.

## Architecture

Next.js App Router project. A single-page demo of a full-viewport heart grid that
reacts to mouse/touch movement.

- `app/` — App Router entry. `layout.tsx` loads the DM Sans font and global
  styles; `page.tsx` renders only `<HeartGrid />`.
- `src/containers/HeartGrid/` — the entire interactive animation. Exported via
  `index.ts`; imported as `@/src/containers/HeartGrid` (the `@/*` path alias maps
  to the repo root, per `tsconfig.json`).

### HeartGrid animation model

`HeartGrid.tsx` is a `"use client"` component that bypasses React rendering for
the hot path — it builds DOM `<span>` hearts imperatively into a `ref` layer and
mutates their `style` directly inside a single `requestAnimationFrame` loop.
State lives in refs (`heartsRef`, `pointersRef`), never React state, to avoid
re-renders during animation.

Per-frame each heart finds its nearest active pointer and drives three banded
targets (opacity / scale boost / vertical float) plus an interpolated color.
Every property eases toward its target via `LERP_SPD` so nothing snaps; a
`LINGER` smooth-step keeps ripples fading after the pointer leaves. Colors
interpolate across the brand palette by distance (`colorForDistance`).

The grid rebuilds on `resize`. The layer is `pointer-events-none` and
`aria-hidden`; pointer data comes from window-level `pointermove`/`touch*`
listeners (mouse and touch handled separately).

### Styling

Tailwind CSS v4 via PostCSS (`@import "tailwindcss"` in `app/globals.css`). Brand
colors and the `--font-body` are defined as theme tokens in the `@theme inline`
block in `globals.css`; the same palette is hard-coded as RGB stops in
`HeartGrid.tsx`. Keep the two in sync when changing brand colors.

## Adding a new section

1. Create `src/containers/NewSection/NewSection.tsx` + `index.ts`.

## Conventions

- **Keep files under ~150 lines.**
- **Descriptive variable names — no terse abbreviations.** Spell names out: `event` not `e`, `element` not `el`, `particle` not `p`, `distance` not `d`, `context` not `ctx`, `index` not `i`, `pointers` not `pts`. This applies to locals, params, and object/interface keys (e.g. `velocityX`/`gravity`/`rotation`, not `vx`/`g`/`rot`). Pick the name for the role, not the type — `t` became `elapsedSeconds`, `amount` (lerp factor), or `timeLeft` depending on meaning. **Only exception:** the true math idioms `x`/`y` (coordinates) and `r`/`g`/`b` (color channels).
- Every `components/X/` and `containers/X/` folder exposes its public API through `index.ts`; import from the folder, not the inner file.