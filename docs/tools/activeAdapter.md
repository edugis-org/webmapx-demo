---
config: config/docs/tools/activeAdapter.json
tagline: Shows which map engine is being used.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-active-adapter.ts
tests:
  - tests/tool-registration.test.ts
related: [zoomLevel, spinner]
---

## what

A small badge naming the map engine: **MapLibre GL**, **OpenLayers**,
**Leaflet** or **Cesium**, with its version.

WebMapX can use four engines, and they do not all support the same features.
Cesium cannot reorder a vector layer against a raster one. View projections
other than Web Mercator are OpenLayers only. MapLibre has the globe. When two
maps behave differently, this badge makes the engine visible.

It is a diagnostic, not a feature for readers. On a public map it is clutter.
On a map you are building, or in a bug report, it is the first thing worth
knowing.

## use

Read it. It changes when the map engine changes, and shows a dash when no map
is attached.

## embed

Add `activeAdapter` with a `position`. There is nothing to configure.

Worth including on a page where readers can switch engines, and worth leaving
out everywhere else.

## extend

The badge reads the engine that is actually attached, not only the one named in
the config. A saved preference or URL parameter can override the config.
