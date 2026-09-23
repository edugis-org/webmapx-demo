---
title: Building a config
tagline: The setup page builds a WebMapX config — tools, layers, starting view, stories and plugins — without writing JSON by hand.
page: ../testpages/setup.html
---

## What the setup page is

A WebMapX map is one JSON config file: which tools it offers, which layers it
can show, where it starts, and which guided tours it has. The
[setup page](../testpages/setup.html) edits such a file with forms and
checkboxes, shows the result on a real map as you go, and hands you the file
to download or publish.

It does not replace the config. Everything it produces is ordinary JSON you can
open, read and edit further; the [tool pages](./index.html) show the config
fragment for each tool.

## Starting from a config

The page opens with the demo config. To work on another one:

- **Upload config** picks a JSON file from your computer, or drop the file
  anywhere on the page.
- **Open path** takes a URL or a path, which also works for a config on a web
  server: paste its address.
- Add `?config=` with a URL to the page's own address to start from that config
  directly.

**Reset to defaults** throws away the changes made in this session and goes
back to the config as it was loaded.

## Tools

The **Tools** tab lists every tool, per toolbar. Tick a tool to put it on that
toolbar, untick it to take it off, and drag the handle to change the order.
Tools that are in the config are shown normally; the rest in grey italics.

Hover a tool and click **⚙** to change its options. Simple values get a field;
lists and objects are edited as JSON. **OK** keeps the change, **Reset** goes
back to what the config had. A **Toolbox** or **Menu** gets its own list of the
tools inside it.

Standalone map controls — scale bar, coordinates, zoom level, inset map and
the like — are listed separately, with a position on the map as one of their
options.

## Plugins

A plugin adds a tool that WebMapX does not ship with. The **Plugins** section at
the top of the Tools tab lists the plugins the config names and loads them;
their tools then appear in the tool lists like any other.

1. Type the plugin's path, relative to the config file — for the example that
   comes with WebMapX: `../plugins/bookmarks.js` — and press **Add plugin**.
2. Tick the new tool (for the example: **Bookmarks**) on a toolbar.
3. Click **⚙** on it to edit its settings. A plugin brings its own default
   settings; the bookmarks plugin starts with three views — World, Amsterdam
   and the Eiffel Tower — which you can change, extend or empty.

**Remove** takes a plugin out of the config; its tools stay in the lists until
the page is reloaded. A plugin is code that runs in the map, so only add
plugins you trust. Plugins may come from the same site as the map or from a
public package CDN (jsDelivr, unpkg, esm.sh); anything else is refused.

## Layers

The **Layers** tab has three lists. **Available layers** are the layers the
config knows but does not show in its layer tree; **+ Add layer…** finds more,
from the shared layer repository or from a WMS, WMTS, Esri or XYZ service URL.
**Layer tree** is the structure the catalog tool shows, and **Active layers**
are the layers switched on when the map opens — top of the list is top of the
map.

## Map

The **Map** tab sets where the map starts: engine, centre, zoom, bearing, pitch
and projection. The map beside the form is live: move it where you want, then
**Update form with map settings** copies the view into the form. **View limits**
and **Max extent** keep users within a zoom range or an area.

## Stories

The **Stories** tab writes guided tours: a story has chapters, a chapter has
steps, and each step has text and a map state — view, visible layers,
projection. Position the map beside the form and use **Capture current view
from map** to fill in a step's camera, or **Preview step on map** to check it.

## Trying and keeping the result

- **Update preview** opens the config in a full map, in a separate tab — keep
  it next to the setup page and press the button again after each change.
- **Download config** saves the JSON file.
- **Publish to GitHub…** commits it straight into a repository you can write
  to, using a personal access token that stays in your browser.

To use the downloaded file, serve it with your map and open the map with
`?config=` pointing at it, or drop the file onto a WebMapX map.
