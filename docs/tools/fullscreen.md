---
config: config/docs/tools/fullscreen.json
tagline: Give the map the whole screen.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-fullscreen-control.ts
tests:
  - tests/tool-registration.test.ts
related: [navigation, insetMap]
---

## what

One button, which hands the map the entire screen and takes it back again.

It uses the browser's Fullscreen API on the map element, so it is the *screen*
the map fills — not just the browser window, and not just the area the page had
allotted it. Browser chrome, page header and the rest of your layout all go
away. For a map embedded in an article, that is the difference between a
postage stamp and something you can actually read.

## use

Click it to fill the screen; click again, or press **Escape**, to come back.
The map keeps its centre, zoom and layers across the change — only the size
alters.

## embed

Add `fullscreen` with a `position`, usually beside the navigation control.

One caveat worth knowing before you file a bug: **an iframe cannot go fullscreen
unless it is allowed to**. If your map is embedded, the embedding page must say
so:

    <iframe src="…" allow="fullscreen"></iframe>

Without that the browser refuses, silently, and the button appears to do
nothing. That is a rule about iframes, not about this control.

## extend

Fullscreen is requested on the `webmapx-map` element rather than on an inner
container, so everything the map owns — the toolbar, the panels, the controls —
comes with it. Requesting it on the canvas alone would fill the screen with a
map you could no longer operate.
