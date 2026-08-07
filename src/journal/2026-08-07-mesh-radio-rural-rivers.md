---
title: "Mesh radio with Rural Rivers"
date: 2026-08-07
layout: layouts/post.njk
tags: journal
image: /assets/images/journal/2026-08-07-mesh-radio-rural-rivers/mesh-radio-system-diagram.jpg
excerpt: "A low-cost, off-grid water-level sensor for community flood monitoring — built with the Rural Rivers project in Vermont."
draft: false
foundations:
  - communication
  - water
---

![System diagram — a Rook ultrasonic sender transmits over LoRa mesh radio to a Heltec V3 receiver, which relays the readings over WiFi to the Bayou cloud store](/assets/images/journal/2026-08-07-mesh-radio-rural-rivers/mesh-radio-system-diagram.jpg)

We're teaming up with the **[Rural Rivers / Mapping for Resilience](https://sites.dartmouth.edu/mappingforresilience/)** project on low-cost, community-run flood monitoring.

Rural Rivers is a research-for-resilience effort — led by researchers at Dartmouth College and the Colorado School of Mines, working alongside flood-impacted communities in the Black and White River Valleys of rural Vermont, which have weathered repeated major floods over the past fifteen years. The project studies how communities respond to overlapping crises, and how clearer communication and better information can strengthen local resilience.

Timely information about *how high the water is getting* is a big part of that picture — and it's exactly what our water-level sensor is designed to provide.

The sensor is a **MeshCore-based ultrasonic water-level monitor**: an ultrasonic rangefinder measures the distance down to the water's surface, and the reading is relayed over **LoRa mesh radio** — so it keeps reporting even where there's no cell service or internet. It's inexpensive to build, can run on solar, and is designed to be set up by anyone.

If you'd like to build and configure one, everything you need is on the **[configuration page for the water-level sensor →](https://waterbearfieldschool.org/water-mesh-config/)** — flash the firmware, pair the two devices, and connect to WiFi, right from your browser.
