---
config: config/docs/tools/layerOverview.json
tagline: The layers that are on the map right now — what they look like, in what order, and how to change it.
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

The legend is the map's contents page. It lists the layers that are actually
drawn, in the order they are drawn, with a swatch showing what each one looks
like — so a layer you cannot find on the map can at least be found in a list.

It is not the catalog. The catalog offers layers you *could* add; the legend
shows the ones you have. The two are usually side by side in the toolbar and
answer different questions: "what else is there?" and "what am I looking at?".

Each row carries the things you want at the moment you are looking at a layer:
a visibility toggle, an opacity slider, **Zoom to layer**, **About this layer**,
**Layer style**, and **Remove layer**. Above the list sit the actions that
apply to all of them — **Show all layers**, **Hide all layers**,
**Clear all layers**, **Save layer(s)…** and **Permalink**.

The swatch is derived from the layer's own paint specification rather than
rendered or fetched, so it costs nothing and cannot fall out of step with the
map. A fill layer shows its fill, a line layer its stroke, a classified layer
its ramp. Layers with no derivable paint — raster basemaps, remote styles —
carry a small baked-in image instead, stored in the config as a `data:` URL.

Order is meaning: the list reads top to bottom as the map reads front to back.
Dragging a row reorders the map itself, across every engine, not just the list.

## use

1. Open the legend from the toolbar. Every layer currently on the map is
   listed, topmost first.
2. Use the checkbox to hide a layer without removing it — hidden layers keep
   their place in the order, and their style.
3. Drag a row by its handle to move a layer in front of or behind another.
4. Open a row's menu for what applies to that layer alone: zoom to its extent,
   read its description, restyle it, or take it off the map.

The style panel deserves its own note: it is deliberately **not** modal. You
judge a colour by looking at the map, so the panel floats over it and can be
dragged out of the way by its title bar. Nothing behind it is blocked.

**Zoom to layer** uses the layer's own extent where it declares one, and the
extent of its features where it does not — so it works for a local vector layer
without any configuration.

## embed

Add the tool to a toolbar and it lists whatever the map has. It needs no
knowledge of the layers themselves.

Three attributes rename its headings, for a map in another language or with
another idea of what a basemap is called: `overview-title`,
`background-title` and `background-group-label`.

## extend

The legend reads `store.mapLayers`, which is the map's own record of what is
drawn — key order is the stacking order, bottom to top, and the list shows it
reversed. Dragging calls `adapter.moveLayer(layerId, beforeLayerId)`, which
reorders that store and delegates to each engine's own layer service, so the
behaviour is generic rather than per-engine.

Two things worth knowing before changing it:

- **Cesium cannot reorder a vector layer against a raster one.** Imagery is
  baked into the globe's surface texture and primitives always draw above it.
  Within one kind, reordering works. This is a property of the engine, not a
  gap in the adapter.
- **A swatch belongs to the layer, not to the panel.** `metadata.swatch` on a
  layer definition overrides everything the panel could derive, and every panel
  that lists layers reads the same value. Only self-contained values are
  honoured — a remote URL is ignored, because the value goes straight into a
  style attribute.
