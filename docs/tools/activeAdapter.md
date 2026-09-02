---
config: config/docs/tools/activeAdapter.json
tagline: Which engine is drawing this map, and which version of it.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-active-adapter.ts
tests:
  - tests/tool-registration.test.ts
related: [zoomLevel, spinner]
---

## what

A small badge naming the rendering engine behind the map: **MapLibre GL**,
**OpenLayers**, **Leaflet** or **Cesium**, with its version.

webmapx is one interface over four engines, and they are not interchangeable in
every detail. Cesium cannot reorder a vector layer against a raster one; view
projections other than Web Mercator are OpenLayers only; MapLibre has the globe.
When a map behaves differently from the one next to it, the engine is usually
why — and this badge is how you find that out in one glance instead of by
reading a config.

It is a diagnostic, not a feature for readers. On a public map it is clutter.
On a map you are building, or in a bug report, it is the first thing worth
knowing.

## use

Read it. It updates if the engine changes, and shows a dash when no map is
attached.

## embed

Add `activeAdapter` with a `position`. There is nothing to configure.

Worth including on a page where readers can switch engines, and worth leaving
out everywhere else.

## extend

The badge reads the adapter that is actually attached, not the engine named in
the config — which matters, because a config's request can be overridden by a
saved preference or a URL parameter. What it reports is what is drawing.
