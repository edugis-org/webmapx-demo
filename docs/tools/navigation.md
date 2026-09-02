---
config: config/docs/tools/navigation.json
tagline: Zoom in, zoom out, and put north back where it belongs.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-navigation-control.ts
tests:
  - tests/tool-registration.test.ts
related: [zoomLevel, fullscreen, scale]
---

## what

The navigation control is the pair of buttons every web map has, plus a compass.

Zoom in and zoom out are obvious. The compass is the one that earns its place:
once a map can be rotated it can be left crooked, and a reader who did not mean
to rotate it has no way back. Clicking the compass returns north to the top —
and it only appears when the map can actually rotate, so it is not a dead
button on an engine that cannot.

It is a convenience, not the only way in: scroll, double-click, pinch and the
keyboard all still work. It exists because a touch device has no scroll wheel
and a first-time reader does not know the gestures.

## use

- **+** and **−** zoom by one level, centred on the middle of the map.
- The **compass** shows which way north is, and resets the bearing when clicked.
- Where the map is tilted, the compass shows the pitch as well.

## embed

Add `navigation` with a `position`, usually `top-right`.

- `show-zoom` — the + and − buttons (on by default).
- `show-compass` — the compass (on by default).
- `visualize-pitch` — tilt the compass to show the pitch, not just the bearing.
- `orientation` — `vertical` (default) or `horizontal`.

Turning both off leaves an empty control; if you want no navigation, leave the
entry out.

## extend

Bearing and pitch are read from the map through the adapter rather than from
one engine's own control, which is why the same component works on all four
engines and why an engine that cannot rotate simply reports that it cannot.
