---
config: config/docs/tools/timeSlider.json
tagline: Sets the time used by time-based layers.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-time-slider-tool.ts
tests:
  - tests/map-clock-redraw.test.ts
related: [deeptime, layerOverview, spinner]
---

## what

Some layers depend on time: where night falls, where the sun and moon stand,
and which latitudes get twelve hours of daylight. The time slider lets those
layers show another moment instead of only now.

The main switch is **Now**:

- **on**: the map uses the current time.
- **off**: the map uses the time set by the sliders.

Time of day and date are separate sliders. The year picker reaches far enough
for cycles that do not fit in one year, such as the moon's 18.6-year
north-south swing.

Press play to advance the slider.

## use

1. Turn **Now** off to take control of the moment.
2. Move the time-of-day slider to watch the terminator sweep round. Move the
   date to watch the seasons change where it falls.
3. Play to run it. Turn **Now** back on to return to live.

## embed

Add `timeSlider` to a toolbar, and give the map at least one layer that depends
on the clock. The computed day/night, sun, and moon layers all do.

The clock lives in the map's store as `mapTime`, not in the panel. A chosen
moment survives closing the tool, and two maps on one page can use different
moments.

## extend

The spinner deliberately hides while the clock is playing: an animation never
reaches idle, so a busy indicator would latch on for the whole run and read as
a map stuck loading rather than a map running.
