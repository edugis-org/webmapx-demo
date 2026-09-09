---
config: config/docs/tools/compare.json
tagline: Compares the current map with later changes.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-compare-tool.ts
  - src/utils/compare-replay.ts
related: [stories, layerOverview, projection]
---

## what

Compare freezes the current map view. You can then change the live map: turn a
layer on, restyle it, import a file, or draw something. A vertical handle shows
the frozen map on one side and the live map on the other.

Both halves share **one camera**. Pan, zoom, rotate, or tilt, and both sides move
together, so differences across the handle are content differences, not view
differences.

It compares the whole map, not only two layers. Either side can include a
different basemap, a new layer, a restyled layer, a drawing, or an analysis
result.

## use

Open the tool, press **Start comparison**. Change the map however you like, then
drag the handle to sweep between before and after.

The panel can be closed while the comparison runs. Closing the panel is how you
get at the layer catalog to fetch the thing you want to compare against, so
ending the comparison is a button in the panel and never a side effect of
closing the panel. The same button ends the comparison and throws the frozen
half away.

A running comparison goes into the permalink, so a link shares both halves and
the handle position. What comes back is a **reconstruction**, not a photograph:
a layer that only ever existed in your own browser has nothing behind its id at
the other end (the share dialog names those local-only layers), and styling
changes made to the frozen half are not carried in the link.

## embed

Add `compare` to a toolbar. Two optional settings:

- `labels`: the names beside the handle, defaulting to *before* and *now*.
- `initialSplit`: where the handle starts, as a percentage of the map width.

Offered on a single-map page. It works on all four engines, because the freeze
is not an engine feature.

## extend

The frozen map is a **second `<webmapx-map>` element**, overlaid on the live one
and clipped with `clip-path`. This avoids maintaining two layer stacks inside
one map.

Freezing is a **replay**, not a serialised config (`src/utils/compare-replay.ts`).
The frozen map is handed the same parsed config object, then the live map's
clocks, its runtime layer requests, the data in each source, and
`store.mapLayers` for visibility, opacity, order, and paint. A config snapshot
would lose the paint. A comparison must not get that wrong, because the frozen
half would then differ from the map the button was pressed on. Source *data* is
copied separately because a drawn layer creates its
source empty and pushes features in per vertex: replaying the request alone
reproduces an empty drawing.

Camera sync is one-directional and **instantaneous**. The frozen map takes no
pointer events, so there is no echo to suppress, and `setViewport` gained
`animate: false` for it. Every engine animated by default, and an animation is
abandoned by the next camera write, so writing center, then bearing, then pitch
each frame canceled itself and the frozen half simply stood still.
