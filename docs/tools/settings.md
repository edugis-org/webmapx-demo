---
config: config/docs/tools/settings.json
tagline: How the map looks, and which engine draws it.
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

Three things a reader may want to change about the map itself rather than about
its contents.

**Appearance** is two independent choices, and keeping them independent is the
point:

- **Theme** — light or dark. Colour only.
- **Style** — `atlas`, `folio` or `console`. Form only: corner radius, surface
  translucency, shadow, density.

Because neither axis touches the other, every style works in both themes
without a combinatorial pile of variants — and a new style needs no dark
version of itself.

**Map engine** switches the renderer: MapLibre GL, OpenLayers, Leaflet or
Cesium. The map is rebuilt with the same config, which is the quickest way to
see what an engine does and does not support — Cesium gives you a globe;
OpenLayers gives you view projections other than Web Mercator.

**API key** is where a key some layers need is entered, kept in this browser.

Every choice is remembered per browser, and the engine is remembered per map,
so a page with two maps can keep different engines in each.

## use

Open settings, choose, and the map changes at once. Nothing needs saving, and
the choices survive a reload.

Switching engines reloads the map, so it takes a moment and briefly clears the
view.

## embed

Add `settings` to a toolbar.

Worth thinking about whether your readers should choose the engine. On a map
built around a globe, or around an equal-area projection, letting someone
switch to an engine that cannot do it produces a map that quietly does less.
Leave the tool out where the engine is part of the design.

## extend

A saved engine preference **outranks the config**, which is deliberate — a
reader's choice should survive a config edit — and is worth knowing when a map
does not come up in the engine you configured. The preference is scoped per
page and per map id, so it does not leak between maps on the same host.

Style and theme are `data-style` and `data-theme` on the root element; anything
consuming the tokens follows automatically, including your own components.
