---
config: config/docs/tools/scale.json
tagline: How far it is across the screen, in units a reader recognises.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-scale-control.ts
tests:
  - tests/tool-registration.test.ts
related: [measure, coordinates, navigation]
---

## what

The scale bar says what a distance on the screen is worth on the ground.

It is measured, not assumed. A web map's scale changes with latitude — the same
pixel is a shorter distance near the poles than at the equator — so a bar drawn
from a fixed table would be wrong almost everywhere. This one asks the map what
its current bounds actually are and sizes the bar from that, at every zoom and
every latitude.

The number is rounded to something readable: a bar reading "500 m" is worth more
than one reading "437 m", so the bar's *length* is adjusted to land on a round
number rather than the number being adjusted to fit a fixed length.

A scale bar is not a ruler. For an actual measurement, with a total and an area,
use the measure tool.

## use

Read it. The bar shows a distance and the length on screen that distance
occupies; it redraws as you zoom and pan.

## embed

Add `scale` with a `position`, usually `bottom-left`.

- `unit` — `metric` (default), `imperial` or `nautical`. Nautical is there
  because a chart is read in nautical miles and converting in your head is how
  mistakes are made.
- `max-width` — the widest the bar may be, in pixels. The rounding happens
  inside that limit.

## extend

The control asks the adapter for the map's bounds rather than reading an
engine's own scale control, so all four engines produce the same bar from the
same measurement — and a projection that is not Web Mercator is handled by the
same path, since the bounds come back in the map's own terms.
