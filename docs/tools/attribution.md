---
config: config/docs/tools/attribution.json
tagline: The credit your data requires, kept legible.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-attribution-control.ts
tests:
  - tests/tool-registration.test.ts
related: [layerOverview, scale]
---

## what

Map data comes with conditions, and nearly all of them say the same thing: show
where the data came from. OpenStreetMap requires attribution, and so do most national
services. The attribution control shows those credits on the map.

It shows attribution for the sources that are **on the map**. Turn a layer off
and its credit disappears. Add a layer and its credit appears. The
text comes from the source definitions.

Credits can be long, so the line scrolls sideways instead of covering the map.

Treat attribution as required furniture rather than as a feature. A map without
credits is usually a licence breach.

## use

Read it and follow the links. The list changes as you add and remove layers.

## embed

Add `attribution` with a `position`, conventionally `bottom-right`.

The text itself belongs to each source, as its `attribution` property. Put the
credit there, and every panel that needs the credit reads from there.

## extend

Attributions come from the live source list. A layer added later, such as a
drawing, analysis result, or dropped file, can show its credit too.
