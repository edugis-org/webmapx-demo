---
config: config/docs/tools/zoomLevel.json
tagline: The zoom you are at, and a box to type the one you want.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-zoom-level.ts
tests:
  - tests/tool-registration.test.ts
related: [navigation, scale, coordinates]
---

## what

A small readout of the current zoom level — and an input, not just a label.

That it can be typed into is the whole point. Zoom is how a web map's detail is
addressed: a tile service is documented in zoom levels, a layer's `minzoom` is
a zoom level, and "it disappears below 14" is the sort of thing you need to
check exactly rather than approach by scrolling. Type 14 and you are at 14.

It reports fractional zoom, because that is what the map is really at after a
trackpad pinch — showing a rounded number would make the readout disagree with
the map it is describing.

## use

Read it, or type a number into it and press Enter. The map goes there.

Most useful next to a layer that appears and disappears with zoom: it tells you
which side of the boundary you are on, which is otherwise guesswork.

## embed

Add `zoomLevel` with a `position`. It needs nothing else.

It is a developer's and an author's control more than a reader's — on a public
map it is usually noise, and on a map you are building it saves a great deal of
scrolling.

## extend

The component is the smallest complete example of the pattern the controls
follow: it listens for the map's view-change events for its value and calls
`setZoom` through the `IMap` interface to change it. Nothing in it is
engine-specific, which is what lets the same control sit on all four engines.
