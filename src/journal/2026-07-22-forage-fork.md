---
title: "Designing a forage fork for goats"
date: 2026-07-22
layout: layouts/post.njk
tags: journal
image: /assets/images/journal/2026-07-22-forage-fork/goatyard-precedent.jpg
excerpt: "A simple rack that holds cut brush at browsing height, built from 2×4s and 1×4s. We modelled the one in the Goodwin Hill goatyard so we can build one for LexFarm."
draft: false
foundations:
  - fabrication
---

{% set img = "/assets/images/journal/2026-07-22-forage-fork/" %}

<div class="float-figure float-left" style="max-width:420px">
  <a href="{{ img }}goatyard-precedent.jpg" target="_blank">
    <img src="{{ img }}goatyard-precedent.jpg" alt="A wooden X-frame rack in a goatyard, with a goat standing on a cable-spool table behind it">
  </a>
  <div class="float-caption">The forage fork already in use in the Goodwin Hill Goats goatyard.</div>
</div>

Goats like to eat with their heads up, stripping leaves and bark from branches. A **forage fork** is a simple rack that holds a bundle of cut brush off the ground at browsing height. That keeps the brush clean, and the herd can work at it from both sides.

There's already one in the [Goodwin Hill Goats](/journal/2026-05-23-goodwin-hill-goats/) goatyard: two sawbuck-style X-frames, rails along the inside of the arms to cradle the brush, and a board underneath to stop the whole thing folding up. It works nicely, so our plan is mostly to replicate it at LexFarm as part of getting ready for a bigger herd.

## The design

We modelled it in OpenSCAD so the size can be adjusted. It comes down to two main settings: the **angle of the X** (wider means a shallower trough and a wider stance) and the **height** of the arms.

The parts, all from ordinary lumber:

- **Four 2×4 legs**, bolted face-to-face in pairs to make the two crosses
- **Four 1×4 cradle rails** along the inside faces of the arms: an upper pair near the tops, and a lower pair down in the crook of the V
- **One 2×4 stop** under the crossings, so the frame can't scissor shut

At the default settings (a 60° X, 34″ tall, 60″ long), the model prints its own cut list: four legs at about 41¼″ with both ends cut 30° off square, two 60″ rails and two 57″ rails, and a 57″ stop.

<div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin:19px 0; align-items:start">

<figure style="margin:0">
  <a href="{{ img }}forage-fork.png" target="_blank"><img src="{{ img }}forage-fork.png" alt="3D model of the forage fork: two wooden X-frames joined by rails" style="width:100%; max-width:100%; height:auto; margin:0; border-radius:8px"></a>
  <figcaption style="font-size:0.95rem; color:var(--muted); margin-top:6px">Three-quarter view of the model.</figcaption>
</figure>

<figure style="margin:0">
  <a href="{{ img }}end-view.png" target="_blank"><img src="{{ img }}end-view.png" alt="End-on view of the forage fork showing the X shape and the trough" style="width:100%; max-width:100%; height:auto; margin:0; border-radius:8px"></a>
  <figcaption style="font-size:0.95rem; color:var(--muted); margin-top:6px">End on: the X and its trough.</figcaption>
</figure>

<figure style="margin:0">
  <a href="{{ img }}loaded.png" target="_blank"><img src="{{ img }}loaded.png" alt="3D model of the forage fork holding a bundle of green branches" style="width:100%; max-width:100%; height:auto; margin:0; border-radius:8px"></a>
  <figcaption style="font-size:0.95rem; color:var(--muted); margin-top:6px">Loaded with brush.</figcaption>
</figure>

</div>

You can [turn the model around in 3D on the project page](/lexfarm/fork/). The OpenSCAD file, with sliders for every setting, is in the [lexfarm repository](https://github.com/waterbearfieldschool/lexfarm/tree/main/fork).

Next step: build it at LexFarm, and see what the goats think.
