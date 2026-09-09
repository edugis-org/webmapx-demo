---
config: config/docs/tools/truearea.json
tagline: Moves an outline to compare its true size at another latitude.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-truearea-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [cartogram, projection, measure]
---

## what

Web Mercator inflates area by 1/cos²(latitude). At 60° that is four times. At
Greenland's latitudes, Mercator makes an island of two million km² look much
larger.

Pick a country's outline and drag it to another latitude. The copied outline
keeps its true ground size and is redrawn for its new position, so distortion is
visible.

Several outlines can be shown at once, each in its own color.

## use

1. Open the tool and choose the layer to take shapes from. Any polygon layer on
   the map can be used.
2. Pick a feature. A copy of the feature appears, in a color of its own.
3. Drag the copy. The outline is recomputed as it moves, so what you see is
   always its true size at that latitude.
4. **Clear all** removes the copied outlines.

The copies are a transient overlay. The copied outlines are for looking at, not
for keeping.

## embed

Add `truearea` to a toolbar. True Area needs a polygon layer on the map to take
shapes from, and says so plainly when there is none.

True Area pairs naturally with the projection tool: drag a country south to see
the distortion, then switch the map to an equal-area projection to see that
distortion removed.

## extend

Map dragging is suspended while the pointer hovers over a draggable outline.
Suspending it only after pointer-down can leave the map in a stuck drag state.
