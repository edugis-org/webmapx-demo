---
config: config/docs/tools/deeptime.json
tagline: Shows reconstructed coastlines from deep time.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-deeptime-tool.ts
  - src/utils/plate-rotation.ts
  - src/utils/spherical-geojson.ts
tests:
  - tests/deeptime-scenes.test.ts
  - tests/spherical-geojson.test.ts
related: [timeSlider, projection, stories]
---

## what

Deep time shows reconstructed coastlines for a chosen moment in the past. Move
the slider back through hundreds of millions of years. The coastlines are
computed by rotating tectonic plates in the browser.

Two plate models are included, so their differences can be compared.

Use Deep time for questions a static palaeogeographic map cannot answer: when
an ocean opened, what was next to what, or how long two coastlines were joined.

## use

1. Open the tool and move the slider. The coastlines redraw for that age.
2. Switch models to see how much of the picture is model rather than fact.

**The layer outlives the panel.** Closing the tool leaves the coastlines on the
map, because closing is how you get the map to yourself. You can then measure
the ocean between two continents, ask the info tool about a polygon, or print
what is on screen. From then on it is an ordinary layer, and the legend is where
you turn it off.

## embed

Add `deeptime` to a toolbar and point it at a plate model with `data`, plus the
ages it covers. Model data is a config asset, resolved relative to the config
file, so it lives beside the config rather than inside webmapx.

A map with no coastline layer gets one. A map that already draws the same
computed source reuses it.

## extend

Reconstructed geometry is cut **on the sphere** before it leaves the tool.
Watch ring winding, degenerate rings, and caps closed exactly along ±90. Each
can make a polygon render inside out or cover the map.

Check an equirectangular *and* an equal-area projection when changing this code.
