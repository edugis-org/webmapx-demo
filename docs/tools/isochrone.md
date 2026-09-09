---
config: config/docs/tools/isochrone.json
tagline: Shows where you can get within a chosen time or distance.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-isochrone-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [routing, buffer, geoprocessing]
---

## what

An isochrone is the area you can reach from a point within a given time. Pick a
place, choose ten minutes on foot, and the result is the shape you can get to.

It is more realistic than a simple buffer. A 500 m circle around a station
assumes you can walk through buildings, across motorways, and over rivers. An
isochrone follows the network, so it grows along roads and stops at barriers.

Ranges can be by **time** or by **distance**, and several can be drawn at once
as nested bands: 5, 10, and 15 minutes shaded from the inside out, which reads as
a catchment rather than as a single edge.

Two services answer it, and which modes you get depends on which:

- **OpenRouteService**: the default. Needs an API key. Car, truck, bicycle,
  foot, and wheelchair.
- **Valhalla**: free, no key, and the fallback when no key is configured. Car,
  truck, motorcycle, bicycle, pedestrian, and bus.

The wheelchair profile, which only OpenRouteService has, is a different question
rather than a slower walk: it accounts for kerbs, steps, and surfaces, and its
shape can differ dramatically from the walking one on the same street.

## use

1. Open the tool and click a center point on the map.
2. Choose a mode, a range type, and the ranges you want.
3. Press **Calculate**. No route service is called until then. The button is
   off until there is a center, and while a request is running.
4. The bands are drawn. **Clear** removes them. **Persist to map** keeps them
   as a layer to analyze or export.

Each calculation replaces the last. Previous bands are removed before the new
request starts.

## embed

Add `isochrone` to a toolbar. **OpenRouteService** is the default: put its key
in the map's API key setting or as a `{key-openrouteservice}` placeholder in the
config, resolved from the `apikeys.json` beside the config.

With no key the tool falls back to **Valhalla**, which needs none. Valhalla is a
free community server, and it can be slow or unreachable. Use OpenRouteService
for maps that need predictable service.

## extend

Bands are colored by rank, smallest innermost, so minutes and kilometres read
the same way. Persisting adds them as an ordinary GeoJSON layer for later use in
Analysis.

Travel modes are not a shared vocabulary: OpenRouteService says `driving-car`
where Valhalla says `auto`. Resolve the selected mode against the active
service before sending the request.
