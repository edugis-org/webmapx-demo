---
config: config/docs/tools/routing.json
tagline: Finds a route, distance and travel time.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-routing-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [isochrone, measure, search]
---

## what

Routing uses a start and an end point to get a route with its **distance** and
**duration**.

This is different from Measure. Measure gives a straight-line distance, or the
length of a line you drew. Routing gives distance along roads, paths or
cycleways.

Four services are offered, and they differ in what you have to bring and in
what they can answer:

- **OSRM**: free, no key. Car, bicycle, and foot. The default.
- **Valhalla**: free, no key, and more modes: car, truck, motorcycle, bicycle,
  pedestrian, and bus.
- **OpenRouteService**: needs an API key. Car, truck, bicycle, foot, and
  wheelchair.
- **TomTom**: needs an API key. Car, truck, bicycle, and pedestrian.

The two free ones are public community servers, offered without a key and
therefore without a quota anyone is accounting for. Treat them as public test
services: they are rate-limited, and they are occasionally unreachable. A keyed service is
the one to use for a map that has to work on a given afternoon.

A truck profile can use axle weight and dimensions, because those can change
which roads are allowed.

A route can be **kept**. By default the route is temporary. Persist it and the
route becomes a normal layer that can be measured, exported, and used in
Analysis.

## use

1. Open routing and click the start point on the map, then the end.
2. Choose a travel mode. The route, its distance, and its duration appear.
3. **Clear** removes the route. **Persist to map** keeps it as a layer.

Duration is the service's estimate for the profile chosen, not a promise about
traffic on the day.

## embed

Add `routing` to a toolbar. OSRM and Valhalla work immediately.
OpenRouteService and TomTom need their key, supplied through the map's API key
setting or a `{key-…}` placeholder in the config, which is resolved from the
`apikeys.json` beside the config.

All four are third-party services with their own usage policies. A map expected
to carry real traffic should use its own instance rather than the public
servers. Expect the free ones to be unavailable sometimes, since a service
nobody is paying for owes nobody an uptime.

## extend

A service definition lists its modes and the function that requests a route.
Adding another service should be one new definition, not a new tool.
