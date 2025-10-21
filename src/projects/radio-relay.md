---
title: "Setting up a DIY Radio Network in Vermont"
date: 2025-10-21
location: "Danville and Worcester VT"
meta: Can we provide mountaintop-to-mountaintop, off-grid communications to communities in rural Vermont?  
image: /assets/images/radio/w1_to_d1.png
layout: layouts/post.njk
permalink: /projects/radio/
---

# Overview

## The relay points

<div id="map" style="height: 400px; width: 100%; margin: 20px 0;"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

<style>
.marker-tooltip {
    background-color: lightblue !important;
    border: 1px solid #007acc !important;
    color: black !important;
}

.line-tooltip {
    background-color: #ffcccc !important;
    border: 1px solid #cc0000 !important;
    color: black !important;
}
</style>

<script>
var map = L.map('map').setView([44.44111491175958, -72.59472537504577], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add markers for each relay point with permanent tooltips (light blue background)
var w1 = L.marker([44.441046, -72.595294]).addTo(map)
    .bindTooltip('W1', {
        permanent: true, 
        direction: 'top',
        className: 'marker-tooltip'
    });

var d1 = L.marker([44.40129262, -72.25192850]).addTo(map)
    .bindTooltip('D1', {
        permanent: true, 
        direction: 'top',
        className: 'marker-tooltip'
    });

var m1 = L.marker([44.41254907908097, -72.56668695160761]).addTo(map)
    .bindTooltip('M1', {
        permanent: true, 
        direction: 'top',
        className: 'marker-tooltip'
    });

var n1 = L.marker([44.40214370620821, -72.21318996782283]).addTo(map)
    .bindTooltip('N1', {
        permanent: true, 
        direction: 'top',
        className: 'marker-tooltip'
    });

// Add red lines connecting the relay points with labels (light red background)
var w1ToM1 = L.polyline([
    [44.441046, -72.595294],      // W1
    [44.41254907908097, -72.56668695160761]  // M1
], {color: 'red'}).addTo(map)
    .bindTooltip('W1 → M1', {
        permanent: true, 
        direction: 'center',
        className: 'line-tooltip'
    });

var m1ToD1 = L.polyline([
    [44.41254907908097, -72.56668695160761], // M1
    [44.40129262, -72.25192850]             // D1
], {color: 'red'}).addTo(map)
    .bindTooltip('M1 → D1', {
        permanent: true, 
        direction: 'center',
        className: 'line-tooltip'
    });

var d1ToN1 = L.polyline([
    [44.40129262, -72.25192850],            // D1
    [44.40214370620821, -72.21318996782283] // N1
], {color: 'red'}).addTo(map)
    .bindTooltip('D1 → N1', {
        permanent: true, 
        direction: 'center',
        className: 'line-tooltip'
    });

// Fit map to show all markers
var group = new L.featureGroup([w1, d1, m1, n1]);
map.fitBounds(group.getBounds().pad(0.1));
</script>

<div class="float-figure float-left">
  <a href="/assets/images/radio/w1_to_d1.png" target="_blank">
    <img src="/assets/images/radio/w1_to_d1.png" alt="Mike and Greg testing solar panel performance on a cloudy day">
  </a>
  <div class="float-caption">W1 to D1.
</div>
</div>

<div class="float-figure float-left">
  <a href="/assets/images/radio/w1_to_d1.png" target="_blank">
    <img src="/assets/images/radio/w1_to_m1.png" alt="Mike and Greg testing solar panel performance on a cloudy day">
  </a>
  <div class="float-caption">W1 to M1.
</div>
</div>

<div class="float-figure float-left">
  <a href="/assets/images/radio/d1_to_n1.png" target="_blank">
    <img src="/assets/images/radio/d1_to_n1.png" alt="Mike and Greg testing solar panel performance on a cloudy day">
  </a>
  <div class="float-caption">D1 to N1.
</div>
</div>





