---
config: config/docs/tools/truearea.json
tagline: Pick a country up and carry it somewhere else, to see how much the projection was flattering it.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-truearea-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [cartogram, projection, measure]
---

## what

Web Mercator inflates area by 1/cos²(latitude). At 60° that is four times; at
Greenland's latitudes it is enough to make an island of two million km² look
like a continent of fourteen. Everyone is told this. Almost nobody believes it,
because the map keeps saying otherwise.

This tool settles it by letting you move the evidence. Take a country's outline
and drag it to another latitude — the shape keeps its true size on the ground
and is redrawn correctly for wherever you put it, so it visibly shrinks as it
comes south. Greenland dropped onto Africa is the demonstration that no amount
of explanation achieves.

Several outlines can be out at once, each in its own colour, so countries can be
compared with each other as well as against the graticule.

## use

1. Open the tool and choose the layer to take shapes from — any polygon layer
   on the map.
2. Pick a feature. A copy of it appears, in a colour of its own.
3. Drag it. The outline is recomputed as it moves, so what you see is always
   its true size at the latitude it is currently over.
4. **Clear all** puts them away.

The copies are a transient overlay. They are for looking at, not for keeping.

## embed

Add `truearea` to a toolbar. It needs a polygon layer on the map to take shapes
from, and says so plainly when there is none.

It pairs naturally with the projection tool: drag a country south to see the
distortion, then switch the map to an equal-area projection to see it removed.

## extend

Dragging is suspended for the map while the pointer merely *hovers* a draggable
outline, rather than on pointer-down. Doing it on hover is what stops a press
from starting a map pan that would then have to be cancelled half-way —
disabling pan mid-gesture leaves the gesture without its end event, and the map
sticks to the cursor.
