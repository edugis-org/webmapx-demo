---
config: config/docs/tools/insetMap.json
tagline: Shows where the main map is.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-inset-map.ts
tests:
  - tests/tool-registration.test.ts
related: [navigation, fullscreen, layerOverview]
---

## what

At high zoom, a map can stop showing where you are. The inset map is a smaller
map in the corner, held a few zoom levels out, with a box around the main map's
current view.

It follows the main map. Pan the main map and the box moves. Zoom the main map
and the inset keeps its offset.

## use

Glance at it. The rectangle is the area of the main map.

Where the control allows it, the inset can be collapsed to get it out of the
way, and restored when you want the context back.

## embed

Add `insetMap` with a `position`, usually a corner the main map's other
controls are not using.

- `zoomOffset`: how many levels *out* from the main map, as a negative number.
  `-5` is a good starting point: enough to show the region and close enough to
  still be recognizable.
- `baseScale`: pin the inset to a constant scale instead of following the main
  map's zoom, for a map that should always show the same country.
- `styleUrl` or `background`: what the inset itself draws. A plain, quiet
  background usually works well because the inset is context.
- `collapsed`, `minimizable`: start it folded away, and let the reader fold it.

## extend

The inset is a second map instance, not a picture. It can have its own
background and projection, but it also makes its own tile requests.
