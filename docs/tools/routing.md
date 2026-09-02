---
config: config/docs/tools/routing.json
tagline: How to get from here to there, how far it is, and how long it takes.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-routing-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [isochrone, measure, search]
---

## what

Set a start and an end, and the tool asks a routing service for the way between
them, then draws it with its **distance** and **duration**.

That is a different question from the measure tool's. Measure gives the distance
as the crow flies, or along a line you drew yourself. Routing gives the distance
along the network — the roads, paths or cycleways that actually exist — which
is usually much longer and always the number that matters for getting somewhere.

Four services are offered, and they differ in what you have to bring and in
what they can answer:

- **OSRM** — free, no key. Car, bicycle and foot. The default.
- **Valhalla** — free, no key, and more modes: car, truck, motorcycle, bicycle,
  pedestrian and bus.
- **OpenRouteService** — needs an API key. Car, truck, bicycle, foot and
  wheelchair.
- **TomTom** — needs an API key. Car, truck, bicycle and pedestrian.

The two free ones are public community servers, offered without a key and
therefore without a quota anyone is accounting for. Treat them as best-effort:
they are rate-limited, and they are occasionally unreachable. A keyed service is
the one to use for a map that has to work on a given afternoon.

A truck profile takes axle weight and dimensions, which change which roads are
usable at all — a route that ignores a bridge's weight limit is not a route.

A route can be **kept**. By default it is a transient overlay; persist it and it
becomes an ordinary layer — measurable, exportable, and something the analysis
tools can take as input.

## use

1. Open routing and click the start point on the map, then the end.
2. Choose a travel mode. The route, its distance and its duration appear.
3. **Clear** removes it; **persist to map** keeps it as a layer.

Duration is the service's estimate for the profile chosen, not a promise about
traffic on the day.

## embed

Add `routing` to a toolbar. OSRM and Valhalla work immediately;
OpenRouteService and TomTom need their key, supplied through the map's API key
setting or a `{key-…}` placeholder in the config, which is resolved from the
`apikeys.json` beside the config.

All four are third-party services with their own usage policies. A map expected
to carry real traffic should use its own instance rather than the public
servers — and should expect the free ones to be unavailable sometimes, since a
service nobody is paying for owes nobody an uptime.

## extend

A service is a small definition — its modes, and a function turning a start, an
end and a mode into a route — so adding another is one entry rather than a new
tool. The drawn route uses the shared data colours, so it stays legible over
satellite imagery instead of matching the panel chrome.
