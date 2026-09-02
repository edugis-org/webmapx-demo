---
config: config/docs/tools/maplanguage.json
tagline: Read the map's labels in the language you want, not the one the ground uses.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-language-osmvector.ts
tests:
  - tests/tool-registration.test.ts
related: [settings, layerOverview]
---

## what

OpenStreetMap vector tiles carry a place's name several times over: `name` as
it is written locally, and `name:en`, `name:de`, `name:ja` and so on where
someone has supplied them. A map usually shows the local one — which is right
in principle and unreadable in practice if the script is not one you read.

This tool switches which of those fields the labels use. Set it to English and
Москва becomes Moscow; set it back and it is Москва again. Around sixty
languages are offered, being those the schema carries.

Nothing is fetched and nothing is re-rendered from scratch: the label
expression in the style is rewritten to prefer the chosen field, falling back
to the local name where that language is missing — which it often is for small
places. So a map does not go blank in the places nobody has translated.

## use

Choose a language. Labels change as the map redraws.

It applies to OpenStreetMap-schema vector layers. A raster basemap has its
labels baked into the image, and no setting can change those.

## embed

`maplanguage` is the one entry in the registry that works either in a toolbar
or on its own — it is `placement: 'both'`. Put it in a toolbar with the other
tools, or place it directly on the map like a control, whichever suits.

The choice is remembered in the browser, and instances on the same page keep in
step with each other.

## extend

The tool hooks `adapter.addLayer` and rewrites the `text-field` expression
*before* the layer reaches any engine, and updates already-added layers through
`updateLayerStyle`. Doing it at that boundary is what makes it work on all four
engines and on layers added later — a layer dropped on the map an hour after
the language was chosen still comes up in the right language.
