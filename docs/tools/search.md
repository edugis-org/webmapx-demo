---
config: config/docs/tools/search.json
tagline: Type a place name, go there — and keep it if it is worth keeping.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-search-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [layerTree, info, routing]
---

## what

Search a place by name and the map goes to it. By default it asks
**Nominatim**, OpenStreetMap's own geocoder, which knows addresses, towns,
mountains and countries.

Results come back as geometry, not just a point. Asking for a city gives its
outline rather than a pin in the middle of it, so "go to Amsterdam" frames the
city instead of centring on a spot in it.

A result can also be **kept**. Selecting one normally moves the map and leaves
nothing behind; with pinning turned on, the found geometry stays as a layer of
its own — which is how a search result becomes something to measure against,
analyse, or take a buffer around.

## use

1. Open search and type. Results appear as you go.
2. Pick one. The map moves to it, framed on the geometry rather than centred on
   a point.
3. Where pinning is enabled, the result stays on the map and appears in the
   legend like any other layer.

Nominatim is a shared public service with a usage policy: it is for occasional
human searching, not for bulk lookups. A map that will be used heavily should
point at its own geocoder.

## embed

Add `search` to a toolbar. Everything about the provider is configurable:

- `endpoint` and `params` — any geocoder that answers with GeoJSON. `params`
  is merged into the query, which is where an API key or a country filter goes.
- `provider` — set to `nominatim` to enable the behaviour specific to it.
- `maxResults` — how many to offer.
- `defaultZoom` — the zoom used for a result with no extent to frame.
- `marker` — draw a marker at the result.
- `persistOnSelect` — keep the chosen geometry as a layer.
- `attribution` — the credit for pinned results. Set it when you pin: a kept
  geometry is data on the map, and data on the map needs its source named.

## extend

The tool emits its selection as an event rather than only acting on it, so a
host application can do its own thing with a result — write it somewhere, feed
another tool, or keep it in a form that outlives the map.
