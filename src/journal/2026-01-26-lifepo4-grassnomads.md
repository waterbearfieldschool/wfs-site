---
title: "LiFePO4 Battery Testing for Grass Nomads"
date: 2026-01-26
layout: layouts/post.njk
tags: journal
image: /assets/images/grassnomads/lifepo4.jpg
excerpt: "Testing lithium iron phosphate batteries for cold-weather solar power in our remote water monitoring system."
foundations:
  - water
---

## Choosing LiFePO4 for Winter in New Mexico

I've been working on improving the power system for the [Grass Nomads](https://www.grassnomads.com/) water monitoring project. The key challenge: finding a battery chemistry that will perform reliably in the cold temperatures of winter in New Mexico. After some research, I've landed on lithium iron phosphate (LiFePO4), which handles cold weather significantly better than lithium-ion or lead acid alternatives.

## Finding the Right Components

I found some nice integrated circuits that will charge a single-cell LiFePO4 battery, along with a relatively inexpensive 7,000 mAh single-cell battery that seems appropriate for our setup.

To verify this capacity would work, I went back and made careful measurements of the power draw of the satellite modem transmitter system—including the new submersible pressure-based depth sensor—both during satellite transmission and during sleep mode.

## Power Consumption Results

The results are promising: after the satellite modem has been put in sleep mode, the overall system draws around **2 milliamps**. This is likely the combined current draw of:

- The boost converter supplying 5V from the 3.2V nominal single-cell LiFePO4 to the satellite modem (which needs power even while asleep)
- The sleep current of the satellite modem itself

A 2 mA draw seems very compatible with a resilient solar-powered system that needs to persist through periods of cloudy weather.

## Current Testing

I'm currently measuring battery drain overnight without any solar charging to verify the draw isn't too large. So far it's going well.

## Next Steps

My current next step is to redesign the overall circuit to integrate the new solar charging chip and boost converter. There are existing products from Adafruit that use these chips, but they're configured for lithium-ion batteries, and the boost chip I've identified as most appropriate isn't combined with my preferred solar charging chip.

I think I need to design a new board that combines these chips in the right configuration.

I'm also considering redesigning the circuitry for measuring the submersible probe, which uses a 4-20 mA current loop sensor. While I'm assessing battery drain, I might look into that redesign as well.

---

For more details on the Grass Nomads water monitoring project, see the [Edge Collective project page](https://edgecollective.io/projects/grassnomads/).
