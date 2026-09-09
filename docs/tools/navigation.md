---
config: config/docs/tools/navigation.json
tagline: Provides zoom buttons and a compass.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-navigation-control.ts
tests:
  - tests/tool-registration.test.ts
related: [zoomLevel, fullscreen, scale]
---

## what

Navigation is the zoom buttons plus a compass.

The compass matters when a map can rotate. It shows where north is, and clicking
it returns north to the top. It appears only when the current map engine can
rotate.

Scroll, double-click, pinch, and keyboard controls still work.

## use

- **+** and **−** zoom by one level, centered on the middle of the map.
- The **compass** shows which way north is, and resets the bearing when clicked.
- Where the map is tilted, the compass shows the pitch as well.

## embed

Add `navigation` with a `position`, usually `top-right`.

- `show-zoom`: the + and − buttons (on by default).
- `show-compass`: the compass (on by default).
- `visualize-pitch`: tilt the compass to show the pitch, not just the bearing.
- `orientation`: `vertical` (default) or `horizontal`.

Turning both off leaves an empty control. If you want no navigation, leave the
entry out.

## extend

Bearing and pitch are read through the map adapter, so the same control can be
used with each engine.
