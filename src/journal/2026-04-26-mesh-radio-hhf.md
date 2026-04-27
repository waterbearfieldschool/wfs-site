---
title: "Setting up mesh radio at HHF"
date: 2026-04-26
layout: layouts/post.njk
tags: journal
image: /assets/images/journal/2026-04-26-mesh-radio-hhf/node-on-hilltop.jpg
excerpt: "A breadboarded MeshCore node, a hilltop above HHF, and two repeaters touched on the first try."
draft: true
foundations:
  - radio
---

![A breadboarded MeshCore node held up at the top of the ridge, the river valley below](/assets/images/journal/2026-04-26-mesh-radio-hhf/node-on-hilltop.jpg)

## The hill does the work

Walked up to the high point above HHF with a breadboarded MeshCore node — antenna, battery, the usual jumble taped to a perfboard — and a phone running the MeshCore app. Powered the node, hit *Discover Nodes*, and within a few seconds the app reported two repeaters in range.

![MeshCore app showing two repeaters discovered: a6f9 and 95d4](/assets/images/journal/2026-04-26-mesh-radio-hhf/discover-nodes.jpg)

## Signal report

Two repeaters discovered, very different link quality:

- **Repeater 95d4** — uplink **+11.75 dB**, downlink **+12.5 dB**. Symmetric and strong; this is a clean link that should be reliable for messages, sensor data, anything.
- **Repeater a6f9** — uplink **−5.0 dB**, downlink **+0.75 dB**. Much weaker, and asymmetric — it can hear us a little better than we can hear it. Distance, terrain, antenna orientation, or all three.

The contrast is itself the lesson: these two nodes are presumably not very far apart in absolute terms, but a few hundred yards of forest and topography between them changes the picture dramatically.

## Why the location matters

…

## Coleman on the ridge

![Coleman sitting on the ridgetop with a backpack, looking out across the valley](/assets/images/journal/2026-04-26-mesh-radio-hhf/coleman-hilltop.jpg)

…

## Next

- Pick a permanent siting spot near the high point
- Note: same device on flat ground a few hundred yards away likely sees neither repeater — the hilltop is doing real work
- Get a couple more nodes into the hands of folks at HHF (Hanan & co.) so this becomes a *network*, not a *demo*
