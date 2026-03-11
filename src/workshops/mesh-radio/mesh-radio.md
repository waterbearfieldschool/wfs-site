---
title: "Mesh Radio"
meta: Introduction to decentralized radio communication that works without cellular service or internet.
layout: layouts/post.njk
permalink: /workshops/mesh-radio/
current: true
workshopDate: "Recurring"
location: "Greater Boston"
image: /assets/images/mesh-radio/mesh_illustration.png
workshopDates:
foundations:
  - communication
level: intro
snipcart: true
---

<!--
workshopDates:
  - id: "mesh-radio-2026-03-15-1200"
    date: "Sunday, March 15, 2026"
    time: "12 PM"
    location: "Online (virtual)"
    maxTickets: 30
-->


<style>
/* ── Hero: image + blurb + register, side by side on desktop ── */
.workshop-hero {
  display: flex;
  gap: 0;
  align-items: flex-start;
  margin: 0 0 1.5em;
}
.workshop-hero-img {
  flex: 0 0 360px;
}
.workshop-hero-img img {
  width: 360px;
  display: block;
  border-radius: 8px;
}
.workshop-hero-body {
  flex: 1;
  min-width: 0;
  margin-left: -20px;
}
.workshop-hero-body p {
  margin: 0 0 10px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--fg, #1f1f1f);
}
/* ── Register button ── */
.register-button {
  display: inline-block;
  background: var(--accent, #1c4d3a);
  color: #fff;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.15s ease;
  margin-bottom: 16px;
}
.register-button:hover {
  background: var(--link, #0b6b50);
  color: #fff;
  text-decoration: none;
}

.register-note {
  font-size: 0.8rem;
  color: #999;
  margin-top: 8px;
  margin-bottom: 0;
}

/* ── Register widget ── */
.register-widget {
  margin-top: 12px;
}
.register-price {
  font-size: 0.9rem;
  color: var(--fg, #1f1f1f);
  margin-bottom: 8px;
}

/* ── Date selector ── */
.date-selector {
  margin-bottom: 10px;
}
.date-selector-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--fg, #1f1f1f);
  margin-bottom: 6px;
}
.date-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}
.date-option input[type="radio"] {
  accent-color: var(--accent, #1c4d3a);
}
.date-option label {
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.date-option.sold-out label {
  color: #999;
  text-decoration: line-through;
}
.availability-badge {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e8f5e9;
  color: #2e7d32;
  white-space: nowrap;
}
.availability-badge.low {
  background: #fff3e0;
  color: #e65100;
}
.availability-badge.sold-out {
  background: #fce4ec;
  color: #c62828;
}

@media (max-width: 600px) {
  .workshop-hero {
    flex-direction: column;
    text-align: center;
  }
  .workshop-hero-img {
    flex: none;
  }
  .workshop-hero-body {
    margin-left: 0;
  }
}
</style>

{% if workshopDates.length %}
<div class="workshop-hero">
  <div class="workshop-hero-img">
    <img src="/assets/images/mesh-radio/mesh_illustration.png" alt="Mesh radio diagram">
  </div>
  <div class="workshop-hero-body">
    <p>A hands-on, outdoor workshop on building decentralized radio networks that work without cell service or internet. No experience required.</p>
    <div class="date-selector">
      <p class="date-selector-label">Choose a workshop date / time:</p>
      {% for date in workshopDates %}
      <div class="date-option" data-date-id="{{ date.id }}" data-max-tickets="{{ date.maxTickets }}">
        <input type="radio" name="workshop-date-top" id="date-top-{{ date.id }}" value="{{ date.id }}"{% if loop.first %} checked{% endif %}>
        <label for="date-top-{{ date.id }}">
          {{ date.date }} at {{ date.time }} — {{ date.location }}
          <span class="availability-badge" data-avail-id="{{ date.id }}"></span>
        </label>
      </div>
      {% endfor %}
    </div>
    <div class="register-widget">
      <p class="register-price">$25 per person</p>
      <button
        class="register-button snipcart-add-item"
        data-item-id="{{ workshopDates[0].id }}"
        data-item-name="Mesh Radio Workshop Ticket — {{ workshopDates[0].date }} at {{ workshopDates[0].time }}"
        data-item-price="25.00"
        data-item-url="/workshops/mesh-radio/"
        data-item-description="Mesh Radio Ticket - {{ workshopDates[0].date }} at {{ workshopDates[0].time }} — {{ workshopDates[0].location }}"
      >Register</button>
    </div>
    <p class="register-note">Read below for more info, or feel free to email <a href="mailto:info@waterbearfieldschool.org?subject=Mesh%20Radio%20Workshop%20Inquiry">info@waterbearfieldschool.org</a> with any questions!</p>
  </div>
</div>
{% endif %}

---

## Background

<img src="/assets/images/mesh-radio/mesh_illustration.png" alt="Diagram showing how mesh radio works: smartphones connect via Bluetooth to mesh radio nodes, which communicate with each other using LoRA radio technology over several miles" style="max-width: 100%; width: 600px; display: block; margin: 0 auto 1.5em;">

Most modern communication depends on distant, expensive infrastructure we rarely see and don't control.

In contrast, a mesh radio network uses small, inexpensive radio devices (around $30) that are able to send and relay messages without relying on cellular towers or the internet. These devices can connect to your smartphone via Bluetooth, then uses LoRA (Long Range) radio technology to communicate with other mesh nodes up to several miles away -- even if the cellular network or power grid is down.

The "mesh" part is key: when nodes are spread across an area, messages automatically hop from one device to the next until they reach their destination. A node in the middle can act as a repeater, extending the network's reach far beyond what any single radio could achieve on its own. No special license is required, and all messages are encrypted.

<div style="max-width: 600px; margin: 2em auto;">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
    <iframe
      src="https://www.youtube.com/embed/AsKzbXKYMOk"
      title="Mesh Radio Explainer"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  </div>
</div>

## What We'll Explore

- What mesh radio is and how it differs from cellular and Wi-Fi
- How messages hop between radios in a mesh network
- The role of antennas, placement, and terrain
- Working with affordable hardware
- Real-world use cases: farms, neighborhoods, events, field work, and protests

## Applications

- **Farm monitoring** - Track conditions across large properties without cellular coverage
- **Grid-down communications** - Maintain text messaging when power and internet are unavailable
- **Remote sensing** - Monitor water levels, temperature, and other conditions in areas without infrastructure
- **Community networks** - Build neighborhood communication systems independent of commercial infrastructure

## You'll Leave With

- A clear mental model of how mesh networks function
- Experience sending messages across a live mesh
- Practical insight into deploying radios in the field
- Better questions about range, reliability, and power

## Who This Is For

Curious beginners, farmers, organizers, educators, outdoor workers—anyone interested in resilient or off-grid communication. No technical background or prior radio experience required.


## Instructors

**Mike Beach** is an Electrical Engineer with experience designing and debugging electro-optical and analog systems. He has held low-noise analog design classes for IEEE, co-taught a robotic design course based on a hybrid Raspberry Pi/Arduino platform at Artisan's Asylum, and is an active participant and mentor at Circuit Hacking night held at the Asylum every Wednesday.

**Don Blair** is a researcher, educator, and tinkerer with a background in physics and philosophy. He has built off-grid systems for remote monitoring, and enjoys exploring ways of helping folks to gain greater control over the technologies on which they depend.

{% if workshopDates.length %}

---

<div class="workshop-hero">
  <div class="workshop-hero-img">
    <img src="/assets/images/mesh-radio/mesh_illustration.png" alt="Mesh radio diagram">
  </div>
  <div class="workshop-hero-body">
    <p>A hands-on, outdoor workshop on building decentralized radio networks that work without cell service or internet. No experience required.</p>
    <div class="date-selector">
      <p class="date-selector-label">Choose a workshop date / time:</p>
      {% for date in workshopDates %}
      <div class="date-option" data-date-id="{{ date.id }}" data-max-tickets="{{ date.maxTickets }}">
        <input type="radio" name="workshop-date-bottom" id="date-bottom-{{ date.id }}" value="{{ date.id }}"{% if loop.first %} checked{% endif %}>
        <label for="date-bottom-{{ date.id }}">
          {{ date.date }} at {{ date.time }} — {{ date.location }}
          <span class="availability-badge" data-avail-id="{{ date.id }}"></span>
        </label>
      </div>
      {% endfor %}
    </div>
    <div class="register-widget">
      <p class="register-price">$25 per person</p>
      <button
        class="register-button snipcart-add-item"
        data-item-id="{{ workshopDates[0].id }}"
        data-item-name="Mesh Radio Workshop Ticket — {{ workshopDates[0].date }} at {{ workshopDates[0].time }}"
        data-item-price="25.00"
        data-item-url="/workshops/mesh-radio/"
        data-item-description="Mesh Radio Ticket - {{ workshopDates[0].date }} at {{ workshopDates[0].time }} — {{ workshopDates[0].location }}"
      >Register</button>
    </div>
    <p class="register-note">Read below for more info, or feel free to email <a href="mailto:info@waterbearfieldschool.org?subject=Mesh%20Radio%20Workshop%20Inquiry">info@waterbearfieldschool.org</a> with any questions!</p>
  </div>
</div>

<script>
(function() {
  // Workshop date metadata from front matter (rendered by Nunjucks)
  var dates = [
    {% for date in workshopDates %}
    { id: "{{ date.id }}", date: "{{ date.date }}", time: "{{ date.time }}", location: "{{ date.location }}", maxTickets: {{ date.maxTickets }} }{% if not loop.last %},{% endif %}
    {% endfor %}
  ];

  // ── Date selection ──
  // When a radio in one group is selected, sync the other group and update buttons
  function updateButtons(selectedId) {
    var dateInfo = dates.find(function(d) { return d.id === selectedId; });
    if (!dateInfo) return;

    document.querySelectorAll('.snipcart-add-item').forEach(function(btn) {
      btn.setAttribute('data-item-id', dateInfo.id);
      btn.setAttribute('data-item-name', 'Mesh Radio Workshop Ticket — ' + dateInfo.date + ' at ' + dateInfo.time);
      btn.setAttribute('data-item-description', 'Mesh Radio Ticket - ' + dateInfo.date + ' at ' + dateInfo.time + ' — ' + dateInfo.location);
    });
  }

  document.querySelectorAll('input[name="workshop-date-top"], input[name="workshop-date-bottom"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      var selectedId = this.value;
      // Sync both radio groups
      document.querySelectorAll('input[name="workshop-date-top"], input[name="workshop-date-bottom"]').forEach(function(r) {
        r.checked = (r.value === selectedId);
      });
      updateButtons(selectedId);
    });
  });

  // ── Availability fetch ──
  var workerUrl = "{{ site.availabilityWorkerUrl }}";

  if (workerUrl && workerUrl !== 'YOUR_WORKER_URL_HERE') {
    var ids = dates.map(function(d) { return d.id; }).join(',');
    fetch(workerUrl + '?ids=' + encodeURIComponent(ids))
      .then(function(res) { return res.json(); })
      .then(function(data) {
        dates.forEach(function(dateInfo) {
          var avail = data[dateInfo.id];
          var badges = document.querySelectorAll('[data-avail-id="' + dateInfo.id + '"]');
          var options = document.querySelectorAll('[data-date-id="' + dateInfo.id + '"]');

          var stock;
          if (avail && avail.stock !== null && avail.stock !== undefined) {
            stock = avail.stock;
          } else {
            stock = dateInfo.maxTickets;
          }

          badges.forEach(function(badge) {
            if (stock <= 0) {
              badge.textContent = 'Sold out';
              badge.className = 'availability-badge sold-out';
            } else if (stock <= 3) {
              badge.textContent = stock + ' spot' + (stock === 1 ? '' : 's') + ' left';
              badge.className = 'availability-badge low';
            } else {
              badge.textContent = stock + ' spots left';
              badge.className = 'availability-badge';
            }
          });

          if (stock <= 0) {
            options.forEach(function(opt) {
              opt.classList.add('sold-out');
              var radio = opt.querySelector('input[type="radio"]');
              if (radio) {
                radio.disabled = true;
                // If this was checked, select the next available date
                if (radio.checked) {
                  radio.checked = false;
                  var available = document.querySelector('.date-option:not(.sold-out) input[type="radio"]');
                  if (available) {
                    available.checked = true;
                    updateButtons(available.value);
                  }
                }
              }
            });
          }
        });
      })
      .catch(function() {
        // Silently fail — badges stay empty, registration still works
      });
  }
})();
</script>
{% endif %}
