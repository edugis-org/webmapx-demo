---
config: config/docs/tools/projection.json
tagline: Choose how the globe is flattened — including projections that keep area honest.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-projection-tool.ts
  - src/utils/view-projections.ts
  - src/map/openlayers-services/projection-support.ts
tests:
  - tests/view-projections.test.ts
related: [truearea, cartogram, 3d]
---

## what

Every flat map is a lie about a sphere; the only question is which lie. Web
Mercator, which nearly every web map uses, keeps angles and destroys area — it
inflates by 1/cos²(latitude), so Greenland arrives fourteen times too large.
For a road map that is a fair trade. For any map about *how much* — population,
land cover, emissions, votes — it is a falsehood at the centre of the picture.

This tool changes the projection the map is **computed** in, not just how it
looks. On offer: Equal Earth, Mollweide, EPSG:6933, polar Lambert azimuthal and
stereographic, alongside Mercator. The panel marks which are **equal-area**, and
the claim is tested rather than asserted — the test suite measures a projected
quad instead of trusting a flag.

This is not the same as the 3D tool's globe. That is two renderings of one
projection family; this changes the family.

**OpenLayers only.** A view's projection is a property of the engine, and of the
four engines only OpenLayers can be given an arbitrary one. On the others the
tool reports that it cannot help rather than pretending.

## use

Pick a projection. The map is rebuilt in it, keeping the ground scale you were
at — so the view stays where it was even though the zoom *number* changes,
because zoom is relative to a projection's own extent.

Choosing a regional projection from outside its area — the Antarctic one while
looking at Europe — recentres to the middle of that region rather than showing
you the blank beyond its edge.

## embed

Add `projection` to a toolbar, on an OpenLayers map. A starting projection can
also be set in `map.projection`, which is applied when the view is *built*
rather than afterwards — a map configured for Equal Earth never draws a Mercator
frame first.

## extend

Two hard-won rules live in the catalog. A projection must declare the latitudes
it may be measured over: polar stereographic sends its antipode to infinity, and
sampling it worldwide once produced an extent 4·10²³ m across, which froze the
tab while it laid out a tile grid. And every catalogued projection is
**metre-based** — a degree-based view makes the vector-tile source-zoom
calculation divide where it should multiply, and the map asks for millions of
tiles for one screen.

Vector tiles do survive the switch: OpenLayers reprojects them in the canvas
renderer. The long-standing issues saying otherwise are stale.
