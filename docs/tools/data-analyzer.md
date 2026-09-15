---
config: config/docs/tools/data-analyzer.json
tagline: Finds useful fields, statistical families, and map-making options in a layer.
status: experimental
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-data-analyzer-tool.ts
  - src/utils/data-analyzer.ts
  - src/workers/data-analyzer.worker.ts
tests:
  - tests/data-analyzer.test.ts
related: [import-layer, layerOverview, geoprocessing]
---

## what

Data analyzer examines the attributes in a vector layer and suggests useful
ways to understand or map them. It identifies numeric fields, missing and
no-data values, likely identifiers, correlations, statistical families, and
likely borders between groups of related attributes.

The family detector uses field names in several languages, including Dutch,
English, Spanish, Finnish, and Greek. It also looks at the values themselves:
percentages that form a whole, complementary fields, additive totals, and
strongly related measures can reveal a family even when the field names are
short, abbreviated, or unfamiliar.

The analysis runs in a Web Worker. The map remains usable while a large layer
is being processed, and the panel reports that it is calculating. Canceling
terminates the current calculation; refresh starts a new one.

## use

1. Open **Data analyzer** and choose a vector layer.
2. Wait for the complete analysis to finish. The panel reports the feature count
   and offers tabs for map options, fields, and families.
3. Review a suggested profile, percentage, or relationship.
4. Press **Map this** to apply a suitable graduated style to the selected field.

The analyzer uses all features available to the browser. GeoJSON, converted
dropped data, and a complete WFS response can therefore be analyzed as a whole.
For MVT or other tiled sources, the browser normally has only the currently
loaded tile features. The tool warns about this: its result describes the loaded
view, not necessarily the complete dataset. Pan or zoom and refresh to analyze
another loaded extent.

No preview or sampling result is presented. A calculation is either still
running, complete, or canceled.

## embed

Add `data-analyzer` to a toolbar. It needs no extra tool settings:

```json
{
  "tools": {
    "data-analyzer": {
      "type": "data-analyzer",
      "enabled": true
    },
    "mainToolbar": {
      "type": "toolbar",
      "enabled": true,
      "position": "top-left",
      "orientation": "vertical",
      "items": [
        {
          "type": "data-analyzer",
          "id": "data-analyzer",
          "enabled": true
        }
      ]
    }
  }
}
```

The analyzer reads data through the active map adapter. Geometry is kept on the
main thread and only feature properties are sent to the worker, which avoids
copying large polygon geometries while preserving the full attribute analysis.

## extend

The pure analysis logic lives in `src/utils/data-analyzer.ts`, so it can be
tested without a browser or map engine. The component collects available
features, sends their properties to `src/workers/data-analyzer.worker.ts`, and
renders the returned `DatasetAnalysis`.

Keep the distinction between complete and tile-backed data visible when adding
new suggestions. A useful future extension is a full-data endpoint for tiled
layers, allowing the worker to analyze the complete source rather than the
features currently loaded in the viewport.

`Map this` currently turns a single-field suggestion into a style-builder
classification and applies it through the adapter. Future map actions can use
the detected family to create coordinated multi-field maps, small multiples,
or derived profile layers while keeping the analyzer independent from styling
implementation details.
