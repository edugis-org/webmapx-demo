---
config: config/docs/tools/zoomLevel.json
tagline: Shows and sets the current zoom level.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-zoom-level.ts
tests:
  - tests/tool-registration.test.ts
related: [navigation, scale, coordinates]
---

## what

A small readout of the current zoom level, with an input for setting it.

Zoom levels matter when checking tile services and layer `minzoom` settings.
Type 14 and the map goes to zoom 14.

It reports fractional zoom, because trackpad and pinch gestures can leave the
map between whole zoom levels.

## use

Read it, or type a number into it and press Enter. The map goes there.

Most useful next to a layer that appears and disappears with zoom. The number
shows which side of the boundary you are on, which is otherwise guesswork.

## embed

Add `zoomLevel` with a `position`. It needs nothing else.

It is a developer's and an author's control more than a reader's. On a public
map it is usually noise, and on a map you are building it saves a great deal of
scrolling.

## extend

The component is a small example of the control pattern: it listens for the
map's view-change events and calls `setZoom` through the `IMap` interface.
