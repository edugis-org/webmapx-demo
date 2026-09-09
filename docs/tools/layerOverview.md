---
config: config/docs/tools/layerOverview.json
tagline: Lists the layers on the map.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-layer-overview.ts
  - src/utils/layer-swatch.ts
tests:
  - tests/layer-swatch.test.ts
related: [layerTree, info, draw]
---

## what

The legend lists the layers drawn on the map, in draw order. There is a
swatch for each layer.

It is not the catalog. The catalog offers layers you *could* add; the legend
shows the layers on the map.

Each row has a visibility toggle, an opacity slider, **Zoom to layer**, **About
this layer**, **Layer style**, and **Remove layer**. At the top of the list are
actions for all layers: **Show all layers**, **Hide all layers**, **Clear all
layers**, **Save layers…**, and **Permalink**.

The swatch comes from the layer's paint specification. A fill layer shows its
fill, a line layer its stroke, and a classified layer its ramp. Layers without
readable paint, such as raster basemaps or remote styles, can use a small
`data:` image from the config.

The list reads top to bottom as the map reads front to back. Dragging a row
reorders the map, not just the list.

## use

1. Open the legend from the toolbar. Every layer on the map is
   listed, topmost first.
2. Use the checkbox to hide a layer without removing it. Hidden layers keep
   their place in the order and their style.
3. Drag a row by its handle to move a layer in front of or behind another.
4. Open a row's menu for what applies to that layer alone: zoom to its extent,
   read its description, restyle it, or take it off the map.

The style panel is **not** modal. It floats over the map and can be dragged by
its title bar, so you can see the map while changing colors.

**Zoom to layer** uses the layer's own extent where it declares one, and the
extent of its features where it does not. This works for a local vector layer
without any configuration.

## embed

Add `layerOverview` to a toolbar. The legend lists whatever layers the map has
and needs no knowledge of the layers themselves.

Three attributes rename its headings, for a map in another language or with
another idea of what a basemap is called: `overview-title`,
`background-title` and `background-group-label`.

## extend

The legend reads `store.mapLayers`, the map's record of what is drawn. Key order
is the stacking order from bottom to top, and the list shows it reversed.
Dragging calls `adapter.moveLayer(layerId, beforeLayerId)`.

Two implementation details matter when changing it:

- **Cesium cannot reorder a vector layer against a raster one.** Imagery is
  baked into the globe's surface texture and primitives always draw over it.
  Within one kind, reordering works. This is a property of the engine, not a
  gap in the adapter.
- **A swatch belongs to the layer, not to the panel.** `metadata.swatch` on a
  layer definition overrides everything the panel could derive, and every panel
  that lists layers reads the same value. Only self-contained values are
  honored. A remote URL is ignored, because the value goes straight into a
  style attribute.
