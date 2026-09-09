---
config: config/docs/tools/stories.json
tagline: Guides readers through a map step by step.
status: stable
audience: [interactive, embedder, developer]
source:
  - src/components/webmapx-stories-tool.ts
  - src/config/story-step-state.ts
tests:
  - tests/tool-registration.test.ts
related: [layerOverview, timeSlider, print]
---

## what

A story is a guided path through a map. Each step can move the camera, choose
which layers are visible, and show text about what is on screen.

A step describes a map state: layers, hidden layers, center, zoom, optional
transparency, projection, and terrain. Steps are grouped into chapters. There is
no click recording and no scripting.

**A story is temporary.** Camera, layer visibility, opacity, projection, and
terrain are captured when the story opens and restored when it closes.

Layers needed by a step are added if the map does not already have them. Those
step-only layers are removed again when you leave the step. Layers that were
already on the map are hidden and restored, never removed.

## use

Open the tool, pick a story, and move through the steps. Chapters group them.
Close the panel and the map returns to where it was.

## embed

A story lives in the `stories` tool section: a name, an optional description and
width, and a list of chapters, each with steps. Each step carries `html` inline
or `htmlUrl` for text kept in a file next to the config. Use `htmlUrl` when the
prose is longer than a config file wants to hold. The URL is resolved relative
to the config, so images and links inside it work.

Step content is sanitized before it is shown.

## extend

The authored step is converted into the same short-key shape a decoded permalink
uses, so applying a step is a set of direct adapter calls: viewport, bearing,
pitch, visibility, opacity, projection, and terrain. No tool state is involved.
Layer visibility and transparency are additionally mirrored into the store so
the legend reflects what a step is showing. The camera is not, because the
capture-and-restore around the whole story already covers it.

`width` on a story widens the tool panel while it is open, through the same
mechanism any tool can use, and resets when it closes.
