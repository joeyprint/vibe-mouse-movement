# Design System

The visual language for **Vibe Mouse Movement** — a warm, paper-toned canvas with
a single crimson heart grid that ripples under the pointer.

## Color

The palette is the source of truth in two places that **must stay in sync**:
theme tokens in `app/globals.css` (`@theme inline`) and the hard-coded RGB stops
in `src/containers/HeartGrid/HeartGrid.tsx`.

| Token              | Hex       | RGB             | Role |
| ------------------ | --------- | --------------- | ---- |
| `--color-cream`    | `#fdf8f2` | 253, 248, 242   | Page background (light) |
| `--color-paper`    | `#fffcf7` | 255, 252, 247   | Raised surfaces |
| `--color-navy`     | `#003049` | 0, 48, 73       | Foreground text; background (dark) |
| `--color-red-brand`| `#c1121f` | 193, 18, 31     | Heart core — pointer center (0–60px) |
| `--color-crimson`  | `#780000` | 120, 0, 0       | Heart mid + idle resting color (60–150px) |
| `--color-steel`    | `#669bbc` | 102, 155, 188   | Heart edge — ripple outer band (150–250px) |

### Background / foreground

`--background` and `--foreground` are semantic aliases that flip with
`prefers-color-scheme`:

- **Light:** cream background, navy text
- **Dark:** navy background, cream text

### Heart color ramp

Heart color is a function of distance from the nearest pointer (`colorForDistance`),
interpolating across three bands then easing back to crimson at rest:

```
0–60px     red-brand → crimson    (hot core)
60–150px   crimson   → steel      (cooling)
150–250px  steel     → crimson    (fading to idle)
>250px     crimson (idle)
```

## Typography

- **Body font:** DM Sans (`next/font/google`, latin subset), exposed as the
  `--font-dm-sans` CSS variable on `<html>` and as the `--font-body` theme token.
- **Stack:** `"DM Sans", -apple-system, system-ui, sans-serif`
- **Base line-height:** `1.6`
- Font smoothing is antialiased (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`).

## Motion

The heart grid is the project's signature motion. Principles:

- **Nothing snaps.** Every animated property (opacity, scale boost, vertical
  float, color) eases toward its target via a fixed lerp factor (`LERP_SPD = 0.09`,
  ~11 frames to arrive).
- **Ripples linger.** After the pointer leaves, a smooth-step fade over
  `LINGER = 1300ms` returns hearts to idle.
- **Banded response.** Proximity drives three intensity tiers (core / mid / edge)
  for opacity, scale, and lift, matched to the color ramp above.
- **Idle life.** At rest, hearts sit at `0.1` opacity and gently "breathe" via a
  per-heart phase-offset sine, so the field is never fully static.

## Layout

- Full-viewport, fixed, `pointer-events-none`, `aria-hidden` decorative layer
  behind content (`z-0`).
- Grid spacing is responsive: `40px` below 540px viewport width, `36px` above.
- `overflow-x: hidden` on `body`; the heart layer clips its own overflow.
