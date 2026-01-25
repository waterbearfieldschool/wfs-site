# Waterbear Field School Website - User Manual

This document explains how to manage workshop lifecycle on the website.

## Workshop Sections Overview

The homepage has three workshop-related sections:

| Section | Purpose | How items appear |
|---------|---------|------------------|
| **Workshops** | Currently offered workshops with registration | Workshops with `current: true` in frontmatter |
| **Recently** | Past workshops we've completed | Hardcoded in `src/index.njk` |
| **Projects** | Future workshops and ongoing projects | Workshops without `current: true` (and external projects) |

---

## Moving a Future Workshop to Current Workshop

When you're ready to offer a workshop, edit its markdown file in `src/workshops/[workshop-name]/[workshop-name].md`:

### Before (Future Workshop):
```yaml
---
title: "DIY Air Filtration"
meta: Learn how to build and assess simple, low-cost, effective DIY air purifiers.
layout: layouts/post.njk
permalink: /workshops/air-filtration/
image: /assets/images/air-filtration/airbox.webp
foundations:
  - air
level: intro
category: "Future Workshop"
---
```

### After (Current Workshop):
```yaml
---
title: "DIY Air Filtration"
meta: Learn how to build and assess simple, low-cost, effective DIY air purifiers.
layout: layouts/post.njk
permalink: /workshops/air-filtration/
image: /assets/images/air-filtration/airbox.webp
current: true
workshopDate: "March 2026"
location: "Greater Boston"
foundations:
  - air
level: intro
---
```

### Changes to make:
1. **Add** `current: true`
2. **Add** `workshopDate: "Month Year"` (displayed on the card)
3. **Add** `location: "City/Region"` (displayed on the card)
4. **Remove** `category: "Future Workshop"` (no longer needed)

---

## Moving a Current Workshop to Recently

When a workshop is completed and you want to archive it in the "Recently" section:

### Step 1: Update the workshop frontmatter

Remove `current: true`, `workshopDate`, and `location` from the workshop's markdown file. Optionally add a category:

```yaml
---
title: "DIY Air Filtration"
meta: Learn how to build and assess simple, low-cost, effective DIY air purifiers.
layout: layouts/post.njk
permalink: /workshops/air-filtration/
image: /assets/images/air-filtration/airbox.webp
foundations:
  - air
level: intro
---
```

### Step 2: Add to the Recently section in index.njk

Open `src/index.njk` and find the "Recently" section (search for `id="recently"`). Add a new article block for your workshop. Copy an existing one and modify it:

```html
<article class="card workshop-card" data-foundation="air">
  <div class="workshop-foundation-band" data-foundation="air">
    {{ foundationInfo.air.emoji }} {{ foundationInfo.air.name }}
  </div>
  <div class="upcoming-workshop-label">Workshop</div>
  <div style="background: var(--card); color: var(--accent); text-align: center; padding: 8px 14px 2px 14px; font-weight: 600; font-size: 1rem;">
    March 2026
  </div>
  <div style="background: var(--card); text-align: center; font-size: 0.9rem; color: var(--link); padding: 0 14px 8px 14px;">Greater Boston</div>
  <a href="/workshops/air-filtration/" class="thumb" aria-label="DIY Air Filtration">
    <img src="/assets/images/air-filtration/airbox.webp" alt="DIY Air Filtration" />
  </a>
  <div class="card-content">
    <h3 style="text-align: center;"><a href="/workshops/air-filtration/">DIY Air Filtration</a></h3>
    <div class="meta-description">Learn how to build and assess simple, low-cost, effective DIY air purifiers.</div>
  </div>
</article>
```

### Fields to customize:
- `data-foundation="air"` - the foundation tag (energy, water, air, communication, etc.)
- `foundationInfo.air` - must match the foundation tag
- `Workshop` or `Event` - the category label
- Date and location
- `href` and `aria-label` - link to the workshop page
- `src` and `alt` - the image path and alt text
- Title and meta description

---

## Available Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Workshop title |
| `meta` | Yes | Short description (shown on cards) |
| `layout` | Yes | Always `layouts/post.njk` |
| `permalink` | Yes | URL path (e.g., `/workshops/my-workshop/`) |
| `image` | Yes | Path to card image |
| `foundations` | Yes | List of foundation tags |
| `level` | No | `intro`, `applied`, or `advanced` |
| `current` | No | Set to `true` for current workshops |
| `workshopDate` | No | Display date (only for current workshops) |
| `location` | No | Display location (only for current workshops) |
| `category` | No | Label band text (e.g., "Future Workshop") |
| `draft` | No | Set to `true` to hide from site |

---

## Foundation Tags

Available foundation tags and their colors:

- `energy` - tan/brown
- `water` - blue
- `air` - light blue
- `food` - green
- `shelter` - brown
- `heating-cooling` - teal
- `communication` - purple
- `fabrication` - orange
- `transport` - red
- `craft` - pink

---

## Quick Reference

| To do this... | Do this... |
|---------------|------------|
| Show in Workshops section | Add `current: true` to frontmatter |
| Show in Projects section | Remove `current: true`, optionally add `category` |
| Show in Recently section | Add HTML block to `src/index.njk` |
| Hide completely | Add `draft: true` to frontmatter |
| Add category label | Add `category: "Label Text"` to frontmatter |
