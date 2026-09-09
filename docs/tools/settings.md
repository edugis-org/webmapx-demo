---
config: config/docs/tools/settings.json
tagline: Changes theme, style, engine, and API keys.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-settings.ts
  - src/theme/webmapx-style-core.css
tests:
  - tests/tool-registration.test.ts
related: [activeAdapter, layerOverview, import-layer]
---

## what

Settings contains map-level choices: theme, interface style, map engine, and API
keys.

**Appearance** has two independent choices:

- **Theme**: light or dark. Color only.
- **Style**: `atlas`, `folio`, or `console`. Form only: corner radius, surface
  translucency, shadow, density.

Every style works in both themes.

**Map engine** switches the renderer: MapLibre GL, OpenLayers, Leaflet or
Cesium. The map is rebuilt with the same config. Use this to check engine
support: Cesium gives you a globe. OpenLayers gives you view projections other
than Web Mercator.

**API key** is where a key some layers need is entered, kept in this browser.

Choices are remembered in the browser. Engine choice is remembered per map.

## use

Open settings, choose, and the map changes at once. Nothing needs saving, and
the choices survive a reload.

Switching engines reloads the map, so it takes a moment and briefly clears the
view.

## embed

Add `settings` to a toolbar.

Think before letting readers choose the engine. On a map built around a globe or
an equal-area projection, switching engines can remove the feature the map was
made for.

## extend

A saved engine preference **outranks the config**. The preference is scoped per
page and per map id, so it does not leak between maps on the same host.

Style and theme are `data-style` and `data-theme` on the root element. Anything
consuming the tokens follows automatically, including your own components.
