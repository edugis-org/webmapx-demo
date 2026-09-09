---
config: config/docs/tools/layerLegend3d.json
tagline: Shows map layers as a 3D stack.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-layer-legend3d.ts
tests:
  - tests/tool-registration.test.ts
related: [layerOverview, 3d, layerTree]
---

## what

This is the legend shown differently. Instead of a list, layers are shown as
slabs stacked in perspective, in the order the map draws them.

The basemap is at the bottom, with other layers over it. Dragging a slab to a
different depth changes what covers what.

Each slab has the same actions as a legend row: visibility, opacity, zoom to
extent, description, style, and remove. It shares the same dialogs as the flat
legend.

Use the flat legend for short layer lists. Use the stack when the main question
is which layers cover others.

## use

- Drag a slab up or down to reorder the map.
- Use a slab's controls exactly as you would a legend row's.

## embed

Add `layerLegend3d` to a toolbar. The 3D legend reads the same layer state as
the flat legend, so the two can coexist and stay in sync.

## extend

The 3D legend uses the same info, style, save, permalink, and clear dialogs as
the flat legend. Keep behavior in the shared components.
