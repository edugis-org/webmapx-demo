---
config: config/docs/tools/deeptime.json
tagline: The map at 200 million years ago — continents where they actually were.
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

Drag a slider back through hundreds of millions of years and watch the
continents move. The coastlines are reconstructed for the chosen moment by
rotating tectonic plates — the same plate models palaeogeographers use, computed
in the browser rather than played back as a video, so any moment can be asked
for rather than only the ones someone rendered.

Two plate models ship, and they can be compared against each other: they
disagree, and where they disagree is itself the interesting part.

It answers the questions a static palaeogeographic map cannot: when did this
ocean open, what was next to what, how long were these two coastlines joined.

## use

1. Open the tool and move the slider. The coastlines redraw for that age.
2. Switch models to see how much of the picture is model rather than fact.

**The layer outlives the panel.** Closing the tool leaves the coastlines on the
map, because closing is how you get the map to yourself — to measure the ocean
between two continents, ask the info tool about a polygon, or print what is on
screen. From then on it is an ordinary layer, and the legend is where you turn
it off.

## embed

Add `deeptime` to a toolbar and point it at a plate model with `data`, plus the
ages it covers. Model data is a config asset, resolved relative to the config
file, so it lives beside the config rather than inside webmapx.

A map with no coastline layer is lent one by the tool; a map that already draws
the same computed source is adopted rather than given a second copy.

## extend

Rotation puts rings anywhere, and everything downstream reads coordinates flat,
so reconstructed geometry is cut **on the sphere** before it leaves. One symptom
— a polygon that swallows the map — had three separate causes, which is why two
earlier attempts failed by fixing one and blaming the others: ring winding (a
clockwise ring means everything *except* the shape), degenerate rings that
enclose nothing, and a cap closed exactly along ±90, which renders inside out.

Mercator and the globe show none of this, because nothing there goes through a
spherical clipper. Check an equirectangular *and* an equal-area projection when
changing it.
