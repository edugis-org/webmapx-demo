---
config: config/docs/tools/measure.json
tagline: Distance, perimeter, area and a height profile — measured on the globe, not on the picture.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-measure-tool.ts
  - src/utils/geo-calculations.ts
tests:
  - tests/measure-units.test.ts
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

**A measurement can be corrected, and it can be kept.** Undo takes back the last
thing you did — a misplaced point, or the click that closed the ring — so a long
line does not have to be started over because the ninth click landed in a canal.
Save turns the measurement into a file: geometry, style and every number it
showed, ready to be dropped back onto any webmapx map, mailed to someone, or
opened in QGIS.

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
6. Misplaced a point? **Undo** takes back one action at a time — press it
   repeatedly to walk back through the whole measurement.
7. **Save** writes the measurement to a file.
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

**Undo, and what one press takes back.** The button, `Ctrl+Z` (`Cmd+Z` on a
Mac), `Backspace` and `Delete` all do the same thing, and which one you reach for
is a matter of habit. What it undoes depends on where you are:

- a closed ring **reopens** — perimeter goes back to being a total, the area
  disappears, and the shape is a line again with all its points intact;
- a finished line **resumes**, so you can keep clicking;
- otherwise the **last point** goes, along with its segment and its share of the
  total.

Closing and placing are two separate actions, so reopening a ring does not also
remove the point you closed on — press undo again for that. The button greys out
when there is nothing left to take back. Typing in a search box is safe:
Backspace there deletes a character, not a measured point.

**Save, and what comes out.** The button hands the measurement to the same save
dialog the legend uses, so the choices are the familiar ones: a filename, style
on or off, a `.zip` or a plain `.geojson`, and coordinate rounding. With style
on you get two files — `<name>.geojson` and `<name>_style.json` — which is
exactly the pair webmapx reads back, so dragging the zip onto any map returns
the measurement with its shape, its colours, its numbered labels and every
attribute still named. Nothing has to be on the map as a layer first; the
measurement is handed over directly.

**Inside the file.** The measured shape — a polygon when closed, a line when not
— carries `segment_1` … `segment_N`, `total` (or `perimeter`), `area` when there
is one, and `measured_in` recording which units you were reading. Beside it sits
one point per segment with its number and its length, so the numbered labels
come back with the shape.

The saved geometry is the **drawn** line, not the clicked corners: a leg is a
great circle, and a long one is written out as the curve you measured rather
than as two points a viewer would join with a straight line through somewhere
else entirely. Amsterdam to Tokyo comes out as 85 vertices over the Arctic, and
its label sits halfway along that curve.

Lengths are written in **metres** and areas in **square metres** whatever the
panel was showing: a file saying "17.12" would need its unit read before the
number meant anything, and would have thrown away three digits getting there.
The unit for display travels separately, in the style file's attribute metadata
— which is also what turns `segment_1` back into "Segment 1" when the file is
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

**Save reuses the save dialog rather than downloading anything itself.** The
dialog already offers the filename, the style checkbox, zip-or-plain and
coordinate rounding, and — more to the point — it writes the
`<name>.geojson` + `<name>_style.json` pair `dropped-layer-builder` reads back.
A second exporter here would be a second format to keep in step with the
importer. One trap it hides: the dialog moves itself to `document.body` on first
open, to escape the panel's `backdrop-filter`, so the `@query` for it must be
cached — an uncached one finds nothing afterwards and every Save click after the
first silently does nothing.

**Undo is not an undo stack.** The tool has exactly three actions that change a
measurement — close, finish, add a point — and each has an obvious inverse, so
the inverse is derived from the current state. A stack would store the same three
facts the state already carries, and would then have to be kept in step with it.

**Metric and imperial are two ladders, not a conversion.** Each switches unit
where its own smaller one stops being readable — 1000 m, but 5280 ft — so
formatting a metric string and converting it would put the break in the wrong
place. `threeSignificant` is shared between them, because how many digits a
reader can use is a fact about reading, not about the unit.
