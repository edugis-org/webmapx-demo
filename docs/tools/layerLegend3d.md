---
config: config/docs/tools/layerLegend3d.json
tagline: The layer stack drawn as a stack — order you can see rather than infer.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-layer-legend3d.ts
tests:
  - tests/tool-registration.test.ts
related: [layerOverview, 3d, layerTree]
---

## what

The same job as the legend, drawn differently: instead of a list, the layers are
shown as slabs stacked in perspective, one above another, in the order the map
draws them.

An ordinary legend puts the top layer at the top of a list, and the reader has
to be told that is what the order means. Here the stack *is* the picture — the
basemap is at the bottom with everything else piled on it, and dragging a slab
to a different depth is visibly the same act as changing what covers what.

Everything a legend row can do, a slab can do: visibility, opacity, zoom to
extent, the layer's description, its style, and removing it. It shares the same
dialogs as the flat legend, so nothing behaves differently — only the arrangement
does.

Pick whichever suits the map. On a map with two or three layers the flat legend
is quicker; on one with a dozen, where the question is what is hiding what, the
stack answers it at a glance.

## use

- Drag a slab up or down to reorder the map.
- Use a slab's controls exactly as you would a legend row's.

## embed

Add `layerLegend3d` to a toolbar. It reads the same layer state as the flat
legend, so the two can coexist and will always agree.

## extend

It is built on the same components as the legend — the info, style, save,
permalink and clear dialogs are shared, not reimplemented. A change to how a
layer is styled therefore appears in both, which is the point of the
arrangement: two presentations, one behaviour.
