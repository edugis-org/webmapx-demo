---
config: config/docs/tools/info.json
tagline: Shows the attributes at a point on the map.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-info-tool.ts
  - src/map/wms-feature-info.ts
tests:
  - tests/info-tool-query.test.ts
related: [layerOverview, measure, draw, street-photos]
---

## what

Info shows the data at a point on the map: feature attributes, elevation where
available, and Street View where configured.

It has two modes:

- **Hover**: move the pointer and the panel follows it, reading the vector
  features under the cursor. Nothing is committed. You are browsing.
- **Pinned**: click, and that location is held. The panel stops following the
  pointer, so you can read it, scroll it, and select the text. Clicking the
  same place again, **Unpin**, or **Escape** lets go of it and returns to
  hovering.

Hover works for vector layers only, because those features are already in the
browser. Clicking also queries WMS layers with `GetFeatureInfo`.

The panel also shows **elevation** where the map has terrain data, and a
**Street View** link for a pinned location when the tool has a Google API key.

Layer metadata can make attributes readable: translate names, add units, and
map coded values to labels. For example, `pop_est` can be shown as population.

## use

1. Open the info tool from the toolbar.
2. Move over the map. The panel shows the features under the pointer, layer by
   layer.
3. Click to pin a location. The panel holds still so you can read and copy it.
4. Click the same spot again, choose **Unpin**, or press **Escape** to release
   it, or click elsewhere to pin that instead.

For tiled vector layers, only drawn features can be queried. A feature outside
the current view or below its zoom range cannot appear in the panel.

## embed

The tool needs no configuration to work: it queries whatever the map has.

One option is worth setting: `googleApiKey`. With a key, a pinned location
offers Street View. Without one, Street View does not appear at all, so leaving
out the key is how you leave out Street View.

```json
"tools": {
  "info": { "googleApiKey": "{key-google}" }
}
```

The key needs the **Street View Static API** enabled in Google Cloud, and is
visible in every visitor's browser, so restrict it to that API and to your own
sites.

The [street photos](./street-photos.html) tool is separate and has its own
`googleApiKey`. Use it for Panoramax photos and a map of where photos exist. A
map can have either tool, or both.

Attribute display comes from the layer, not from this tool. Give a layer
`metadata.attributes.translations` and every panel that shows those properties
reads the same definitions.

## extend

Hover and pinned mode use different query paths. Hover is throttled and
hit-tests within a few pixels. A click uses a slightly wider tolerance. A second
click close to the pinned point unpins it.

Escape reaches the tool through `handleEscape()` on `WebmapxBaseTool`: the panel
asks the active tool first and closes only when it returns false.

`metadata.attributes` may be a string naming a shared definition in
`layerData.attributeMetadata`. Use that when many layers share the same columns.
