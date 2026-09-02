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

Map data comes with conditions, and nearly all of them are the same condition:
say where it came from. OpenStreetMap requires it, and so do most national
services. The attribution control is how a webmapx map keeps that promise
without you having to remember which layer needs which line.

It collects the attribution from the sources that are **currently on the map**
and shows them together. Turn a layer off and its credit goes with it; add one
and its credit appears. There is nothing to maintain, and nothing to get out of
date, because the text comes from the same source definitions the map is drawn
from.

Credits are long and maps are narrow, so it scrolls sideways rather than
wrapping over the map, with a small ‹ › marker when there is more to see.

Treat it as required furniture rather than as a feature. A map without it is
usually a licence breach.

## use

Read it; follow the links. The list changes as you add and remove layers.

## embed

Add `attribution` with a `position`, conventionally `bottom-right`.

The text itself belongs to each source, as its `attribution` property — that is
where to put a credit, and every panel that needs it reads from there.

## extend

Attributions are gathered from the live source list rather than from the config
file, so a layer added at runtime — a drawing, an analysis result, a file
someone dropped on the map — contributes its credit too, with nothing extra to
wire up.
