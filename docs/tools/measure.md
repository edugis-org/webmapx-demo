---
config: config/docs/tools/measure.json
tagline: Measures lengths, areas and perimeters by clicking on the map.
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

Measure calculates lengths, areas and perimeters from points clicked on the map.

The measure tool gives up to four results:

- **distance** along a line, per segment, and as a total length.
- **area** of a shape, once the line is closed into a shape.
- **perimeter** of that shape, the total length including the closing segment.
- a **height profile** along the line, if the map has an elevation layer. So a
  route has a length and a climb.

**The measurements are made on the globe, not on the flat picture.** Every
projection of the earth distorts distances and areas when the round earth is
drawn on a flat surface such as a computer screen. On a normal web map,
Greenland looks as big as Africa, and an area read off that picture is wrong by
a factor of 14. The measure tool ignores the projection and calculates distance
and area directly on the sphere, so a measurement in Svalbard is comparable with
one in Kenya.

The tool works at any scale, from a back garden to the distance from New York
to London (5570 km). Press the unit button in the panel to show results in
metric (m, km, m², ha, km²) or imperial (ft, mi, sq ft, acres, sq mi). The
choice is stored in this browser, so it is still there after a reload.

The height profile uses a hundred points along the line and is redrawn while
points are added. The profile appears by itself when the map has elevation data.
There is nothing to switch on.

A measurement can be corrected with undo, and it can be saved to a file. The
file holds the shape and all the numbers that were shown, so it can be mailed to
someone, opened in QGIS or another GIS program, or dropped back on a webmapx
map. Saving with styling adds a second file with the colors and labels. That
second file is only understood by webmapx. QGIS reads the shape and the numbers
from the GeoJSON file and ignores the style file.

Use a different tool when:

- the area of a feature that is already on the map is wanted: use **True area**.
- the result should become a layer to style, save and analyse: use **Draw**,
  then **Analysis**.

## use

1. Open the ruler icon in the toolbar.
2. Click the map to place the first point.
3. Click again for each next point. The panel shows each segment length and the
   total length so far.
4. Double-click, right-click, or press Escape to finish the line.
5. To measure an area, click the **first** point again to complete the shape.
   The **area** appears in the panel, and the total length is now called
   **perimeter**.
6. Placed a point in the wrong spot? Press **Undo** to take back one step at a
   time.
7. Press **Save** to write the measurement to a file.
8. Press **m / km** (or **ft / mi**) to change the displayed unit system.
   Only the readout changes, so switching costs no precision.
9. If the map has an elevation layer, the height profile appears under the
   readout and follows every new point.
10. The measurement stays on the map until it is cleared or a new one is
    started.

Inside a unit system, the unit follows the size of the number, always with three
significant digits: metres for values under a kilometre and kilometres after
that, feet for values under a mile and miles after that, then square feet, acres,
and square miles.

Nothing is added to the legend. A measurement is scratch work and disappears
when it is cleared, unless it is saved.

**What undo takes back.** The button, `Ctrl+Z` (`Cmd+Z` on a Mac), `Backspace`
and `Delete` all do the same thing. The effect depends on the state of the
measurement:

- on a completed shape, undo **opens it again**: the area disappears, perimeter
  becomes a total length, and the shape is a line again with all its points.
- on a finished line, undo **reopens the line**, so clicking can go on.
- otherwise the **last point** is removed, together with the segment length and
  its part of the total.

Completing a shape and placing a point are two separate steps, so opening the
shape again does not also remove the point it was completed on. Press undo again
for that. The button greys out when there is nothing left to undo. Typing in a
search box is safe: Backspace there deletes a character, not a point.

**What Save produces.** Save opens the same dialog the legend uses, so the
options are familiar: a filename, style on or off, a `.zip` or a plain
`.geojson`, and coordinate rounding. With style on, Save writes two files,
`<name>.geojson` and `<name>_style.json`. That pair is what webmapx reads back:
drop it on any webmapx map and the measurement returns with its shape, colors,
numbered labels, and named attributes. The measurement does not have to be a
layer on the map first.

**What is in the file.** The measured shape (a polygon when completed, a line
when not) carries `segment_1` … `segment_N`, `total` (or `perimeter`), `area`
when there is one, and `measured_in` for the units shown at the time. The file
also contains one point per segment with its number and length, so the numbered
labels come back with the shape.

The file holds the **drawn** line, not only the clicked points. A long leg
follows a great circle, so the saved line is written out as the measured curve.
Amsterdam to Tokyo comes out as 85 vertices over the Arctic, with its label
halfway along that curve.

Lengths are always written in **metres** and areas in **square metres**,
whatever the panel was showing. A file saying "17.12" would be unreadable
without its unit, and rounding to the displayed value would throw away digits.
The display unit travels separately, in the style file. The style file is also
what turns `segment_1` back into "Segment 1" when the file is dropped on a map.

## embed

The line is drawn by the map engine itself, so the tool needs no source, no
layer and no data. Enabling it is the whole configuration.

The height profile is the one exception: the profile appears only when the map
has an elevation (`raster-dem`) layer, which is why the demo config mentioned
earlier has one.

## extend

The component handles the pointer events, the totals, the panel, and the profile
graph. The arithmetic lives separately in `src/utils/geo-calculations.ts`
(`haversineDistanceCm`, `geodesicAreaM2`, `formatDistance`, `formatArea`) and
uses no DOM, so it can be tested directly. `tests/measure-units.test.ts` does
that.

Distances are held as **integer centimetres**, not floating-point metres, and
`formatDistance` is the only place that turns them into text. If you add a
second readout elsewhere in the UI, call it instead of rounding yourself.

**Save reuses the save dialog instead of downloading a file itself.** The dialog
already offers filename, style, zip-or-plain, and rounding, and it writes the
`<name>.geojson` + `<name>_style.json` pair that `dropped-layer-builder` reads
back. A second exporter here would be a second format to keep in sync with the
importer. One trap: the dialog moves itself to `document.body` the first time it
opens, to escape the panel's `backdrop-filter`, so the `@query` for it must be
cached. An uncached query finds nothing after that, and every Save click after
the first does nothing at all.

**Undo is not an undo stack.** Only three actions change a measurement (complete
a shape, finish a line, add a point) and each has an obvious opposite. The
opposite is derived from the current state. A stack would store the same facts twice and would have
to be kept in sync.

**Metric and imperial are two separate ladders, not a conversion.** Each one
changes unit where its own smaller unit stops being readable: 1000 m, but
5280 ft. Formatting in metric and then converting would put the switch in the
wrong place. `threeSignificant` is shared by both, because the number of digits a
reader can use is a fact about reading, not about the unit.
