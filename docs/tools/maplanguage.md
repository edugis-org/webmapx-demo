---
config: config/docs/tools/maplanguage.json
tagline: Changes the language used for map labels.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-language-osmvector.ts
tests:
  - tests/tool-registration.test.ts
related: [settings, layerOverview]
---

## what

OpenStreetMap vector tiles can carry several names for a place: `name` as it is
written locally, and `name:en`, `name:de`, `name:ja` and so on where they are
available. A map usually starts with the local name.

This control switches which name field labels use. Set it to English and Москва
becomes Moscow. Set it back and it is Москва again. Around sixty languages are
offered.

No new data is fetched. The label expression is changed to prefer the chosen
field, falling back to the local name where that language is missing.

## use

Choose a language. Labels change as the map redraws.

It applies to OpenStreetMap-schema vector layers. A raster basemap has its
labels baked into the image, and no setting can change those.

## embed

`maplanguage` works either in a toolbar or on its own. Put it in a toolbar with
the other tools, or place it directly on the map like a control.

The choice is remembered in the browser, and instances on one page stay in step.

## extend

The tool hooks `adapter.addLayer` and rewrites the `text-field` expression
before the layer reaches an engine. Already-added layers are updated through
`updateLayerStyle`, and layers added later get the same language rule.
