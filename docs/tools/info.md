---
config: config/docs/tools/info.json
tagline: Point at a feature and read what it is — attributes, elevation, and the view from the street.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-info-tool.ts
  - src/map/wms-feature-info.ts
tests:
  - tests/info-tool-query.test.ts
related: [layerOverview, measure, draw]
---

## what

A map draws a country as a shape. The info tool is how you ask which country it
is, how many people live there, and where the number came from.

It works in two modes, and the difference is the whole design:

- **Hover** — move the pointer and the panel follows it, reading the vector
  features under the cursor. Nothing is committed; you are browsing.
- **Pinned** — click, and that location is held. The panel stops following the
  pointer, so you can read it, scroll it, and select the text. Clicking the
  same place again unpins and returns to hovering.

Hovering answers vector layers only, because a vector feature is already in the
browser and can be hit-tested for free. Clicking additionally asks any WMS layer
a `GetFeatureInfo` question over the network — a request per click is
reasonable, a request per pointer move is not.

Alongside the attributes it reports the **elevation** at that point where the
map has terrain data, and a **Street View** thumbnail where a Google API key is
configured, linking through to the panorama.

Raw attribute names are rarely for reading. `pop_est` is a column; "population"
is what a person wants to see. The tool applies the layer's attribute metadata:
names are translated, units appended, and coded values mapped to labels — so a
field holding `2` can display as "municipality" rather than as a number.

## use

1. Open the info tool from the toolbar.
2. Move over the map. The panel shows the features under the pointer, layer by
   layer.
3. Click to pin a location — the panel holds still so you can read and copy it.
4. Click the same spot again to release it, or move on and click elsewhere to
   pin that instead.

Nothing under the pointer means nothing is *there* — in a tiled vector layer,
only what has been drawn can be asked about, so a feature outside the current
view or below its zoom range has no answer to give.

## embed

The tool needs no configuration to work: it queries whatever the map has.

One option is worth setting — `googleApiKey`, which turns on the Street View
thumbnail. Without it the rest of the panel is unchanged; that section simply
does not appear.

Attribute display comes from the layer, not from this tool. Give a layer
`metadata.attributes.translations` and every panel that shows those properties
reads the same definitions.

## extend

The two modes have deliberately different query paths, and the tolerances are
constants worth knowing before changing them: hover is throttled and hit-tests
within a few pixels; a click uses a slightly wider tolerance, and a second click
within a few pixels of the pinned point is read as "unpin" rather than as a new
pin.

`metadata.attributes` may be a string instead of an object, naming a shared
definition in `layerData.attributeMetadata`. On a catalog where fifty layers use
the same column names that is the difference between one definition and fifty
copies — and copies drift.
