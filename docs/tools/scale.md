---
config: config/docs/tools/scale.json
tagline: Shows the current map scale.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-scale-control.ts
tests:
  - tests/tool-registration.test.ts
related: [measure, coordinates, navigation]
---

## what

The scale bar shows what a distance on the screen is worth on the ground.

Scale changes with latitude. The same pixel is a shorter ground distance near
the poles than at the equator, so the bar is sized from the map's current
bounds.

The number is rounded to something readable. The bar length changes to land on
a round value such as "500 m."

A scale bar is not a ruler. For an actual measurement, with a total and an area,
use the measure tool.

## use

Read it. The bar shows a distance and the length on screen that distance
occupies. The scale redraws as you zoom and pan.

## embed

Add `scale` with a `position`, usually `bottom-left`.

- `unit`: `metric` (default), `imperial`, or `nautical`. Nautical is there
  because a chart is read in nautical miles and converting in your head is how
  mistakes are made.
- `max-width`: the widest the bar may be, in pixels. The rounding happens
  inside that limit.

## extend

The control asks the adapter for the map's bounds. That gives the same path for
all engines and for projections other than Web Mercator.
