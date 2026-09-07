---
config: config/docs/tools/compare.json
tagline: Freeze the map as it is, keep working, and drag a handle to see what changed.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-compare-tool.ts
  - src/utils/compare-replay.ts
related: [stories, layerOverview, projection]
---

## what

Press the button and the map is photographed. From then on the map keeps
answering to you — turn a layer on, restyle it, import a file, draw something —
while a vertical handle across the middle holds the old picture on its left and
the new one on its right.

Both halves share **one camera**. Pan, zoom, rotate or tilt and the frozen half
follows exactly, so nothing you see across the handle is a difference of
viewpoint: every difference is a difference in *content*. That is the whole
point, and it is why there is no second set of navigation controls.

It is a comparison of the map, not of two layers. Anything the map can be made
to show can be on either side of the line — a different basemap, a layer added
after the freeze, the same layer restyled, a drawing, an analysis result.

## use

Open the tool, press **Start comparison**. Change the map however you like, then
drag the handle to sweep between before and after.

The panel can be closed while the comparison runs — closing it is how you get at
the layer catalog to fetch the thing you want to compare against, so ending the
comparison is a button in the panel and never a side effect of closing it. The
same button ends it and throws the frozen half away.

A running comparison goes into the permalink, so a link shares both halves and
the handle position. What comes back is a **reconstruction**, not a photograph:
a layer that only ever existed in your own browser has nothing behind its id at
the other end (the share dialog names those), and styling changes made to the
frozen half are not carried in the link.

## embed

Add `compare` to a toolbar. Two optional settings:

- `labels` — the names beside the handle, defaulting to *before* and *now*.
- `initialSplit` — where the handle starts, as a percentage of the map width.

Offered on a single-map page. It works on all four engines, because the freeze
is not an engine feature.

## extend

The frozen map is a **second `<webmapx-map>` element**, overlaid on the live one
and clipped with `clip-path`. Per-layer screen-space clipping was the obvious
alternative and is a dead end: only OpenLayers and Leaflet can do it at all, and
one map would then have to carry two layer stacks — colliding ids, two exclusive
background groups, and one legend that has to choose between them. Clipping the
element is composited, so dragging the handle repaints neither map.

Freezing is a **replay**, not a serialised config (`src/utils/compare-replay.ts`).
The frozen map is handed the same parsed config object, then the live map's
clocks, its runtime layer requests, the data currently sitting in each source,
and `store.mapLayers` for visibility, opacity, order and paint. A config
snapshot would lose the paint — which is exactly the thing a comparison must not
get wrong, since the frozen half would then differ from the map the button was
pressed on. Source *data* is copied separately because a drawn layer creates its
source empty and pushes features in per vertex: replaying the request alone
reproduces an empty drawing.

Camera sync is one-directional and **instantaneous**. The frozen map takes no
pointer events, so there is no echo to suppress, and `setViewport` gained
`animate: false` for it — every engine animated by default, and an animation is
abandoned by the next camera write, so writing centre, then bearing, then pitch
each frame cancelled itself and the frozen half simply stood still.
