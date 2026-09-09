---
config: config/docs/tools/search.json
tagline: Finds a place by name and moves the map there.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-search-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [layerTree, info, routing]
---

## what

Search for a place by name and the map moves to the result. By default Search
uses **Nominatim**, OpenStreetMap's geocoder.

Results can include geometry, not only a point. A city result can frame the city
outline instead of centering on a single point.

A result can also be **kept**. With pinning turned on, the found geometry stays
as its own layer, so it can be measured, analyzed, or buffered.

## use

1. Open search and type. Results appear as you go.
2. Pick one. The map moves to the result, framed on the geometry rather than
   centered on a point.
3. Where pinning is enabled, the result stays on the map and appears in the
   legend like any other layer.

Nominatim is a shared public service with a usage policy: it is for occasional
human searching, not for bulk lookups. A map used heavily should
point at its own geocoder.

## embed

Add `search` to a toolbar. Everything about the provider is configurable:

- `endpoint` and `params`: any geocoder that answers with GeoJSON. `params`
  is merged into the query, which is where an API key or a country filter goes.
- `provider`: set to `nominatim` to enable the behavior specific to it.
- `maxResults`: how many to offer.
- `defaultZoom`: the zoom used for a result with no extent to frame.
- `marker`: draw a marker at the result.
- `persistOnSelect`: keep the chosen geometry as a layer.
- `attribution`: the credit for pinned results. Set it when you pin: a kept
  geometry is data on the map, and data on the map needs its source named.

## extend

The selection is emitted as an event, so a host app can store the result
or pass it to another workflow.
