---
config: config/docs/tools/measure.json
tagline: Distance, perimeter, area and a height profile — measured on the globe, not on the picture.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-measure-tool.ts
  - src/utils/geo-calculations.ts
related: [truearea, draw, buffer]
---

## what

Measure turns the map into a ruler. Four readings come out of it:

- **distance** along a line, segment by segment and as a running total;
- **perimeter** once you close the line into a ring — the same running total,
  now including the closing segment, and named for what it has become;
- **area** enclosed by that ring;
- a **height profile** along the measured line, whenever the map has an
  elevation layer — so a route has a length *and* a climb, and a "flat" walk
  turns out not to be.

**The numbers are measured on the globe, not on the picture.** Distances use the
haversine formula and areas spherical excess, so nothing here depends on the
projection you happen to be looking at. That distinction is the whole point:
a straight line drawn across Web Mercator is not the shortest route, and a
shape's area there is inflated by 1/cos²(latitude) — Greenland reads as the size
of Africa, and a measured "area" taken off that picture would be wrong by a
factor of fourteen. Measure on the sphere and a reading in Svalbard is
comparable with one in Kenya.

**It works at every scale, from a continent to a back garden.** New York to
London (5570 km) and the outline of your own house or garden are the same
operation with the same formulas; only the unit the answer is printed in
changes. Both systems are offered — metric (m, km, m², ha, km²) and imperial
(ft, mi, sq ft, acres, sq mi) — switched from the button in the panel, and
remembered for next time.

The height profile is sampled at a hundred points along the whole line (or
around the whole ring) and redrawn as you add points. It appears by itself when
an elevation source is on the map and is absent when there is none — nothing to
switch on.

Use something else when: you want the area of a feature that already exists
rather than one you draw — that is **True area** — or you want the result to
become a layer you can style, save and analyse — that is **Draw**, then
**Analysis**.

## use

1. Open the ruler icon in the toolbar.
2. Click on the map to place the first point.
3. Click again for each next point. Each segment's length and the running total
   appear in the panel.
4. Double-click, right-click, or press Escape to finish the line.
5. To measure an area, click the **first** point again to close the ring. The
   total is relabelled **perimeter** and the enclosed **area** appears beneath
   it — both exist only once the ring is closed, which is why neither is shown
   before that.
6. Misplaced a point? **Undo** takes back the last thing you did — the button,
   or Ctrl+Z, Backspace or Delete. On a closed ring the first undo reopens it;
   the next removes the last point.
7. **Save** hands the measurement to the ordinary save dialog: filename, style
   on or off, .zip or plain GeoJSON. Drag the saved file back onto any map and
   the measurement returns — same shape, same colours, and every number still
   named.
8. Press **m / km** (or **ft / mi**) to switch between metric and imperial. Only
   the reading changes: distances are held in centimetres and areas in square
   metres throughout, so switching costs no precision.
9. If the map carries an elevation layer, the height profile appears under the
   readout and follows every point you add.
10. The finished measurement stays on the map until you clear it or start a new
   one.

The unit inside a system is chosen by magnitude, always to three significant
digits: metres below a kilometre and kilometres above it; feet below a mile and
miles above it; square feet, then acres, then square miles.

Nothing is added to the legend. A measurement is scratch work, and it is gone
when you clear it — unless you save it, which is what turns it into a layer you
can keep.

**What a saved measurement carries.** The measured shape — a polygon when
closed, a line when not — with `segment_1` … `segment_N`, `total` (or
`perimeter`), `area` when there is one, and `measured_in` recording which units
you were reading. Beside it, one point per segment carrying its number and its
length, so the numbered labels come back with the shape.

The saved geometry is the **drawn** line, not the clicked corners: a leg is a
great circle, and a long one is written out as the curve you measured rather
than as two points a viewer would join with a straight line through somewhere
else entirely. Amsterdam to Tokyo comes out as 85 vertices over the Arctic, and
its label sits halfway along that curve. The
lengths are written in **metres** and areas in **square metres** whatever the
panel was showing: a file saying "17.12" would need its unit read before the
number meant anything, and would have thrown away three digits getting there.
The unit for display travels separately, in the style file's attribute metadata,
which is also what turns `segment_1` back into "Segment 1" when the file is
dropped on a map.

## embed

The line is drawn by the map engine's own overlay, so the tool needs no source,
no layer and no data — enabling it is the whole configuration. The height
profile is the one exception: it appears only when the map has an elevation
(`raster-dem`) layer, which is why the demo config above carries one.

## extend

The component owns everything: the pointer handling, the running totals, the
panel and the profile sparkline. The arithmetic lives apart in
`src/utils/geo-calculations.ts` (`haversineDistanceCm`, `geodesicAreaM2`,
`formatDistance`, `formatArea`), deliberately free of the DOM so it can be
tested directly — `tests/measure-units.test.ts` does exactly that.

Distances are carried in **centimetres as integers**, not metres as floats;
`formatDistance` is the only place that turns them into text. A second readout
elsewhere in the UI should call it rather than round on its own.

**Metric and imperial are two ladders, not a conversion.** Each switches unit
where its own smaller one stops being readable — 1000 m, but 5280 ft — so
formatting a metric string and converting it would put the break in the wrong
place. `threeSignificant` is shared between them, because how many digits a
reader can use is a fact about reading, not about the unit.
