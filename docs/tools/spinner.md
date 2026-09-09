---
config: config/docs/tools/spinner.json
tagline: Shows when the map is busy.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-spinner.ts
tests:
  - tests/tool-registration.test.ts
related: [activeAdapter, layerOverview]
---

## what

A spinner appears while the map is loading tiles or rendering, and disappears
when the map settles. The spinner helps distinguish a slow map from a broken
one.

**While the map's clock is playing**, the spinner is hidden. An animation may
never reach idle, so the spinner would otherwise stay on for the whole run.

Tiles that arrive during animation are therefore not shown as a loading state.

## use

Nothing to operate. The spinner appears while the map is busy and goes away
when the map is not busy.

## embed

Add `spinner` with a `position`.

- `small`: a more discreet size for a map with little room.
- `nocolor`: drop the accent color, for a map whose palette it would fight.

## extend

The store's `mapBusy` still records what the engine reports. This component
decides whether that busy state should be shown.
