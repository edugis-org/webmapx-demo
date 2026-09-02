---
config: config/docs/tools/stories.json
tagline: A guided tour through a map — camera, layers and words, one step at a time.
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

A map with twenty layers can show almost anything and, to someone meeting it
for the first time, shows nothing. A story is the authored path through it:
each step moves the camera, chooses which layers are on, and says something
about what is now visible.

A step is written in plain terms — the layers, which of them are hidden, a view
with a centre and zoom, optional transparency, projection and terrain — and
steps are grouped into chapters. There is no recording of clicks and no
scripting; a step is a description of a state, so it can be edited later by
someone who was not there when it was made.

**A story is a visit, not a change.** The camera, the layer visibility, the
opacities, the projection and the terrain are all captured when it opens and
restored when it closes, so the map ends up exactly as it was. Nothing leaks
into the permalink afterwards.

Layers a step refers to are added if the map does not have them, and removed
again as soon as you navigate away from the step that wanted them. So what the
legend lists depends only on the step you are on — never on which steps you
happened to visit on the way. A layer that was already on the map before the
story opened is only hidden and restored, never removed: the story does not own
it.

## use

Open the tool, pick a story, and move through the steps. Chapters group them.
Close the panel and the map returns to where it was.

## embed

A story lives in the `stories` tool section: a name, an optional description
and width, and a list of chapters, each with steps. Each step carries `html`
inline or `htmlUrl` for text kept in a file next to the config — useful when the
prose is longer than a config file wants to hold, and resolved relative to the
config so images and links inside it work.

Step content is sanitised before it is shown.

## extend

The authored step is converted into the same short-key shape a decoded permalink
uses, so applying a step is a set of direct adapter calls — viewport, bearing,
pitch, visibility, opacity, projection, terrain — with no tool state involved.
Layer visibility and transparency are additionally mirrored into the store so
the legend reflects what a step is showing; the camera is not, because the
capture-and-restore around the whole story already covers it.

`width` on a story widens the tool panel while it is open, through the same
mechanism any tool can use, and resets when it closes.
