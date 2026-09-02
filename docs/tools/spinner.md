---
config: config/docs/tools/spinner.json
tagline: The map is working — a busy indicator that knows when not to appear.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-spinner.ts
tests:
  - tests/tool-registration.test.ts
related: [activeAdapter, layerOverview]
---

## what

A spinner shown while the map is loading tiles or rendering, and hidden when it
settles. Its job is to distinguish *slow* from *broken*: a map that has not
finished drawing looks exactly like a map that has failed, and the difference
matters most on the connections where it is hardest to tell.

The interesting part is when it stays away. **While the map's clock is
playing** — an animated time series, a rotating globe — the spinner is
suppressed on purpose. An animation never reaches idle: every frame pins a new
moment, every computed source is rebuilt, and the map is drawing again before
it can settle. Whatever was loading when play started would latch the spinner
on for as long as the animation ran, which reads as a map stuck loading rather
than a map running.

Tiles genuinely arriving mid-animation therefore go unreported. That is the
trade, and it is the right way round: the moving picture is already telling you
the map is working, and a spinner that is always on is worse than no spinner.

## use

Nothing to operate. It appears while the map is busy and goes away when it is
not.

## embed

Add `spinner` with a `position`.

- `small` — a more discreet size for a map with little room.
- `nocolor` — drop the accent colour, for a map whose palette it would fight.

## extend

The suppression lives in this component rather than in the engines, deliberately:
the store's `mapBusy` stays an honest report of what the engine said, and this
control decides what is worth showing a reader. That is the same reasoning as
`BaseAdapter.silenceComputedSource` — a redraw that fetches nothing is not a
wait anyone is having.
