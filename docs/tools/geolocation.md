---
config: config/docs/tools/geolocation.json
tagline: Where you are, how well the device knows it, and — if you ask — where you have been.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-geolocation-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [measure, draw, coordinates]
---

## what

Geolocation puts your own position on the map, using the browser's location
service. Two things are drawn, and the second matters as much as the first: a
marker for the position, and a circle for its **accuracy**. A fix is not a
point, it is a claim with a radius, and a map that draws only the dot invites
people to believe a precision the device never offered.

**Track me** keeps the fixes coming and joins them into a trail, so a walked
route appears behind you. Tracks are kept in the browser between sessions, and
each tracking session is a separate track rather than one endless line.

A stored track can be put back on the map as an ordinary layer (**Add to map**),
written out as files (**Save as files**), or deleted (**Erase from memory**).
Points and lines are both produced, so a track can be read as a route or as the
individual readings that make it up — including the accuracy of each one.

Raw satellite fixes are noisy, and a naive map jumps: a bad reading throws the
marker across the street and the trail grows a spike. The tool judges each fix
against how fast you are actually moving before accepting it as your position,
so standing still does not produce a trail and a single wild reading does not
become a corner.

Nothing here reaches the network. Position comes from the browser, tracks are
stored in this browser, and the export is a local download.

## use

1. Open the tool. The browser asks for permission in a prompt of its own —
   **allow it**. The permission belongs to the browser, not to the map, so a
   refusal cannot be worked around from here, only granted again.
2. Your position appears with its accuracy circle. A large circle means the
   device is unsure — indoors, or without a satellite fix — rather than that
   the map is wrong.
3. Turn on **Track me** to record a trail. Close the panel and it keeps
   running; the map does not have to stay in front of you.
4. Open a stored track to add it to the map, save it, or erase it.

Two things stop it before it starts, and both look the same from inside the
page — the browser reports **Permission denied, code 1** either way:

- **The page is not on a secure origin.** Browsers hand out location only over
  `https://`, or on `localhost` while you are developing. A map served from a
  plain `http://` address is refused before the prompt ever appears, so there
  is nothing to allow. Serve it over HTTPS.
- **The prompt was dismissed or blocked.** Browsers remember that answer and
  stop asking, so reloading changes nothing. Reopen it from the padlock or the
  location icon in the address bar and set this site back to *Allow*.

If the browser has no location service at all, the tool says so plainly instead
— that message is distinct.

Accuracy varies by device and surroundings far more than by anything the map
can do. A phone outdoors gives metres; a desktop over Wi-Fi may give the city.

## embed

Add `geolocation` to a toolbar. The behaviour is tunable through attributes on
the element:

- `watch` — keep following the position rather than taking a single fix
  (default on).
- `high-accuracy` — ask the device for its best effort, at a cost in battery
  (default on).
- `timeout` and `max-age` — how long to wait for a fix, and how old a cached
  one may be.
- `follow` — keep the map centred on the position as it moves.
- `zoom` — the zoom to use when the map moves to a fix.

Serve the map over **HTTPS**. Browsers give location only to a secure context —
`https://`, or `localhost` while developing — and a map on a plain `http://`
host is refused with a permission error that looks exactly like a reader having
said no. It is the first thing to check when the tool works for you and not for
someone else.

## extend

Position state is shared between every instance on a page rather than held per
component, so a map with the tool in two places does not open two location
watches or draw two markers.

Stored tracks are kept compactly — one array per point, of track id, order,
timestamp, longitude, latitude and accuracy — because a long walk is a lot of
points and browser storage is small. `buildTrackGeoJSON` is what turns them
back into the point and line collections the map and the export use.

The plausibility rules are the part to leave alone unless you have a recording
to test against: they are scaled by a moving average of recent speed, so the
same jump is accepted from a car and rejected from someone standing still.
