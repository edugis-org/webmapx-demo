---
config: config/docs/tools/import-layer.json
tagline: Paste a service URL and add what it turns out to offer.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-import-layer-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [layerTree, layerOverview, settings]
---

## what

Most map data lives behind a service that will describe itself if asked. Paste
a URL and this tool asks: what layers are here, in what projections, under what
names?

It recognises **WMS**, **WMTS**, **Esri** services and plain **XYZ** tile
templates, and it is forgiving about what you give it. A capabilities URL
works, and so does a URL copied straight out of the browser's network tab —
which is usually how you get one, having found a map somewhere and wondered
what it was drawing.

What comes back is a list to choose from. Picking one adds it as a normal layer:
legend row, opacity, ordering, info queries, the lot.

## use

1. Open the tool and paste the URL.
2. It reports what the endpoint offers.
3. Tick the layers you want and add them.

A service that refuses is usually refusing because of **CORS** — a browser may
not read a response from another origin unless that origin allows it. That is a
decision by the service, not by the map, and no setting here can overrule it.
Many public services do allow it; some do not.

## embed

Add `import-layer` to a toolbar. Nothing to configure.

Consider who your readers are before including it: on a map for a wide audience
it invites adding layers with no attribution, no styling and no guarantee of
staying up. On a map for people building maps it is one of the most useful
things in the toolbar.

## extend

Discovery goes through the same source-normalisation the config loader uses, so
a layer added this way is described exactly as a configured one is — which is
what lets it then be saved into a permalink, or copied into a config file as a
starting point.
