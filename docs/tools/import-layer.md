---
config: config/docs/tools/import-layer.json
tagline: Adds layers from a service URL.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-import-layer-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [layerTree, layerOverview, settings]
---

## what

Many map services publish a description of the layers they offer. Import layer
reads that description from a URL and lists the layers it can find.

It recognizes **WMS**, **WMTS**, **Esri** services, and plain **XYZ** tile
templates. A capabilities URL works, and so do many URLs copied from a
browser's network tab.

Choose from the list to add a normal layer, with a legend row, opacity, order
and feature info where the service supports it.

## use

1. Open the tool and paste the URL.
2. The panel lists what the endpoint offers.
3. Tick the layers you want and add them.

A service that refuses is usually refusing because of **CORS**. A browser may
not read a response from another origin unless that origin allows it. That is a
decision by the service, not by the map, and no setting here can overrule it.
Many public services do allow it. Some do not.

## embed

Add `import-layer` to a toolbar. Nothing to configure.

Consider who your readers are before including it. On a public map it can invite
layers with no attribution, no styling, and no uptime promise. On a map for
authors it is useful.

## extend

Imported layers use the same source-normalisation as configured layers. That
keeps permalink and config export behavior the same.
