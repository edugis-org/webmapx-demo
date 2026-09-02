---
config: config/docs/tools/insetMap.json
tagline: A small map showing where the big one is.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-inset-map.ts
tests:
  - tests/tool-registration.test.ts
related: [navigation, fullscreen, layerOverview]
---

## what

Zoom far enough into any map and it stops saying where you are. Streets look
like streets everywhere. The inset map is the second, smaller map in the corner
that answers "where is this?" — held a few zoom levels out, with a box showing
what the main map is currently looking at.

It follows the main map: pan and the box moves, zoom and it keeps its offset.
It is a reference, not a second map to get lost in.

## use

Glance at it. The rectangle is the area of the main map.

Where the control allows it, the inset can be collapsed to get it out of the
way, and restored when you want the context back.

## embed

Add `insetMap` with a `position`, usually a corner the main map's other
controls are not using.

- `zoomOffset` — how many levels *out* from the main map, as a negative number.
  `-5` is a good starting point: enough to show the region, close enough to
  still be recognisable.
- `baseScale` — pin the inset to a constant scale instead of following the main
  map's zoom, for a map that should always show the same country.
- `styleUrl` or `background` — what the inset itself draws. A plain, quiet
  background is what you want; the inset is context, and detail in it competes
  with the map it is describing.
- `collapsed`, `minimizable` — start it folded away, and let the reader fold it.

## extend

The inset is a real second map instance, not a picture, which is what lets it
carry its own background and its own projection. That also means it costs a
second set of tile requests — which is why a deliberately plain background is
the default advice, and why `baseScale` exists for maps where the inset need
not move at all.
