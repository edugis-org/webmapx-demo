---
config: config/docs/tools/isochrone.json
tagline: Everywhere you can reach in ten minutes — the shape that answers "how far is it, really".
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
place, say ten minutes on foot, and the tool draws the shape you can get to.

It is the honest version of a buffer. A 500 m circle around a station assumes
you can walk through buildings, across motorways and over rivers; an isochrone
follows the network, so it bulges along the roads and stops at the barriers.
Where the two disagree — and by a river they disagree enormously — the
isochrone is the one describing the world.

Ranges can be by **time** or by **distance**, and several can be drawn at once
as nested bands: 5, 10 and 15 minutes shaded from the inside out, which reads as
a catchment rather than as a single edge.

Two services answer it, and which modes you get depends on which:

- **OpenRouteService** — the default. Needs an API key. Car, truck, bicycle,
  foot and wheelchair.
- **Valhalla** — free, no key, and the fallback when no key is configured. Car,
  truck, motorcycle, bicycle, pedestrian and bus.

The wheelchair profile, which only OpenRouteService has, is a different question
rather than a slower walk: it accounts for kerbs, steps and surfaces, and its
shape can differ dramatically from the walking one on the same street.

## use

1. Open the tool and click a centre point on the map.
2. Choose a mode, a range type and the ranges you want.
3. Press **Calculate**. Nothing is asked of the service until you do — the
   button is disabled until there is a centre, and stays disabled while a
   request is in flight, so pressing it repeatedly cannot stack up calls.
4. The bands are drawn. **Clear** removes them; **Persist to map** keeps them
   as a layer to analyse or export.

Each calculation replaces the last: the previous bands are removed *before* the
new request goes out, so what is on the map is never a shape belonging to a mode
or a range the form no longer shows.

## embed

Add `isochrone` to a toolbar. **OpenRouteService** is the default: put its key
in the map's API key setting or as a `{key-openrouteservice}` placeholder in the
config, resolved from the `apikeys.json` beside the config.

With no key the tool falls back to **Valhalla**, which needs none — so the panel
still works out of the box. Valhalla is a free community server offered without
a quota anyone is accounting for, and it is sometimes simply unreachable; when
it is, the request times out rather than returning an error, which reads as the
tool hanging. That is the reason the keyed service is the default.

## extend

The bands are coloured by rank rather than by value, smallest innermost, so a
set of three reads the same way whether they are minutes or kilometres.
Persisting hands them to the map as an ordinary GeoJSON layer, which is what
lets the analysis tool then intersect them with population or address data —
the usual next question after "what can I reach" is "how many people live in it".
It stores a full copy rather than the live collection, so the next calculation
cannot reach into a layer that has already been saved.

Travel modes are not a shared vocabulary — OpenRouteService says `driving-car`
where Valhalla says `auto` — and the active service can change without the
reader touching anything, because a missing key falls back. The mode actually
sent is therefore resolved against the service in use, not read blindly from the
dropdown's last value.
