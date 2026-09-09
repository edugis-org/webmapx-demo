---
config: config/docs/tools/projection.json
tagline: Changes the map projection.
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

Every flat map distorts the globe. Web Mercator, used by most web maps, keeps
angles but inflates area by 1/cos²(latitude). Greenland appears far too large.
For a road map that can be acceptable. For maps about amounts, such as
population, land cover, emissions, or votes, area distortion can mislead.

Changing projection changes the projection the map is **computed** in, not only
how it looks. Choices include Equal Earth, Mollweide, EPSG:6933, polar Lambert
azimuthal and stereographic, alongside Mercator. The panel marks which are
**equal-area**.

This is not the same as the 3D tool's globe. The globe changes rendering. This
changes the projection.

**OpenLayers only.** Of the four engines, only OpenLayers can use these view
projections.

## use

Pick a projection. The map is rebuilt in that projection, keeping the ground
scale you were at. The view stays where it was even though the zoom *number*
changes, because zoom is relative to a projection's own extent.

Choosing a regional projection from outside its area moves to the middle of that
region rather than showing you the blank beyond its edge. For example, the
Antarctic projection moves to Antarctica when you are looking at Europe.

## embed

Add `projection` to a toolbar, on an OpenLayers map. A starting projection can
also be set in `map.projection`, which is applied when the view is *built*
rather than afterwards. A map configured for Equal Earth never draws a Mercator
frame first.

## extend

A projection must declare the latitudes it can be measured over. Polar
stereographic sends its antipode to infinity, so world sampling can produce an
unusable extent. Every cataloged projection must also be **metre-based**.

Vector tiles survive the switch because OpenLayers reprojects them in the
canvas renderer.
