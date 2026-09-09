---
config: config/docs/tools/geolocation.json
tagline: Shows your location and optional track.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-geolocation-tool.ts
tests:
  - tests/tool-registration.test.ts
related: [measure, draw, coordinates]
---

## what

Geolocation puts your position on the map, using the browser's location service.
It draws a marker and an **accuracy** circle. The circle matters: a location fix
is an estimate, not an exact point.

**Track me** keeps receiving location fixes and joins them into a trail. Tracks
are stored in the browser between sessions. Each tracking session is a separate
track.

A stored track can be added back to the map (**Add to map**), saved as files
(**Save as files**), or deleted (**Erase from memory**). Saved tracks include
both a line and the individual points with their accuracy.

Location fixes can be noisy. The tool filters unlikely jumps against recent
speed, so standing still does not produce a long trail and one bad fix does not
become a sharp corner.

Nothing here reaches the network. Position comes from the browser, tracks are
stored in this browser, and the export is a local download.

## use

1. Open the tool. The browser asks for permission in a prompt of its own.
   **Allow it**. The permission belongs to the browser, not to the map, so a
   refusal cannot be worked around from here, only granted again.
2. Your position appears with its accuracy circle. A large circle means the
   device is unsure. This can happen indoors, or without a satellite fix. It
   does not mean the map is wrong.
3. Turn on **Track me** to record a trail. Close the panel and tracking keeps
   running. The map does not have to stay in front of you.
4. Open a stored track to add it to the map, save it, or erase it.

Two things can stop geolocation before it starts, and both look the same from
inside the page. The browser reports **Permission denied, code 1** either way:

- **The page is not on a secure origin.** Browsers hand out location only over
  `https://`, or on `localhost` while you are developing. A map served from a
  plain `http://` address is refused before the prompt ever appears, so there
  is nothing to allow. Serve it over HTTPS.
- **The prompt was dismissed or blocked.** Browsers remember that answer and
  stop asking, so reloading changes nothing. Reopen the permission from the
  padlock or the location icon in the address bar and set this site back to
  *Allow*.

If the browser has no location service, the panel says so.

Accuracy varies by device and surroundings far more than by anything the map
can do. A phone outdoors gives metres. A desktop over Wi-Fi may give the city.

## embed

Add `geolocation` to a toolbar. The behavior is tunable through attributes on
the element:

- `watch`: keep following the position rather than taking a single fix
  (default on).
- `high-accuracy`: ask the device for a more accurate fix, at a cost in battery
  (default on).
- `timeout` and `max-age`: how long to wait for a fix, and how old a cached
  one may be.
- `follow`: keep the map centered on the position as it moves.
- `zoom`: the zoom to use when the map moves to a fix.

Serve the map over **HTTPS**. Browsers give location only to a secure context:
`https://`, or `localhost` while developing. A plain `http://` host is refused
with the same permission error as a denied prompt.

## extend

Position state is shared across instances on a page, so two geolocation
controls do not open two location watches or draw two markers.

Stored tracks use one compact array per point: track id, order, timestamp,
longitude, latitude, and accuracy. `buildTrackGeoJSON` turns them back into the
point and line collections used by the map and export.

Change the plausibility rules only with recorded tracks to test against. They
scale by a moving average of recent speed, so the same jump may be valid in a
car and invalid while standing still.
