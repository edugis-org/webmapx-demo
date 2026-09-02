---
config: config/docs/tools/timeSlider.json
tagline: When the map is — for the layers that are a function of the moment.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-time-slider-tool.ts
tests:
  - tests/map-clock-redraw.test.ts
related: [deeptime, layerOverview, spinner]
---

## what

Some layers are not documents on a server; they are a function of the moment.
Where night falls, where the sun and the moon stand, which latitudes get twelve
hours of daylight. Until there is a clock they can only mean *now*, which
answers "what is happening" and cannot answer "what changes over a day" or "why
is a Norwegian summer like that" — the two questions those layers exist for.

There is one switch, and it is called **Now**:

- **on** — the map runs with the clock, as every map does by default. Now is
  not a moment you can hold, so it is a state rather than a position on a
  slider.
- **off** — the map is frozen at a moment, and the sliders do something. The
  instant it is frozen at is already the past, which is why it is no longer
  called now.

Time of day and date are separate sliders because they are separate questions,
and the year picker reaches far enough for the cycles that do not fit in one
year — the moon's north–south swing runs on an 18.6-year period, so 2024 and
2034 look quite different.

Press play and the slider advances, which is deliberately the *slider's* job:
the map moves because the slider moved, rather than a second animation loop
racing the refresh that keeps a live map current.

## use

1. Turn **Now** off to take control of the moment.
2. Move the time-of-day slider to watch the terminator sweep round; move the
   date to watch the seasons change where it falls.
3. Play to run it. Turn **Now** back on to return to live.

## embed

Add `timeSlider` to a toolbar, and give the map at least one layer that depends
on the clock — the computed day/night, sun and moon layers all do.

The clock lives in the map's store as `mapTime`, not in the panel, so a chosen
moment survives closing the tool, and two maps on one page can stand at two
different moments.

## extend

The spinner deliberately hides while the clock is playing: an animation never
reaches idle, so a busy indicator would latch on for the whole run and read as
a map stuck loading rather than a map running.
