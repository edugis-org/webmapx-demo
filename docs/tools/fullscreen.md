---
config: config/docs/tools/fullscreen.json
tagline: Fills the screen with the map.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-fullscreen-control.ts
tests:
  - tests/tool-registration.test.ts
related: [navigation, insetMap]
---

## what

One button to put the map in fullscreen and leave fullscreen again.

It uses the browser's fullscreen API on the map element. Browser chrome, the
page header, and the rest of the layout are hidden while fullscreen is active.

## use

Click it to fill the screen. Click again, or press **Escape**, to come back.
The map keeps its center, zoom, and layers across the change. Only the size
changes.

## embed

Add `fullscreen` with a `position`, usually beside the navigation control.

**An iframe cannot go fullscreen unless it is allowed to.** If your map is
embedded, the embedding page must say so:

    <iframe src="…" allow="fullscreen"></iframe>

Without that the browser refuses the request.

## extend

The code requests fullscreen on the `webmapx-map` element, so the toolbar,
panels, and controls come with the map.
