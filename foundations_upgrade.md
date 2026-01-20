# Waterbear Field School: Foundations Restructure

## Project Goal

Reorganize the site from a flat list of workshops into a **curriculum-based structure** built around 8 "Foundations" categories. Introduce a **Resilience Sequence** cohort program as the flagship offering. The new structure should:

1. Make the larger educational vision visible (not just individual workshops)
2. Create clear learning pathways within each foundation
3. Offer a bundled "Resilience Sequence" that rotates seasonally
4. Maintain all existing workshop content (don't delete, just reorganize)

**Branch:** `foundations-restructure`  
**Approach:** Build new structure alongside existing pages so we can compare before replacing.

---

## The 8 Foundations

Each foundation answers a core resilience question and contains multiple workshops at different levels.

| Foundation | Core Question | Color (suggested) |
|------------|---------------|-------------------|
| **Energy** | How do we generate and store power? | Amber/Gold |
| **Water** | How do we collect, store, and purify water? | Blue |
| **Food** | How do we grow, preserve, and cook food? | Green |
| **Shelter** | How do we build and maintain structures? | Brown/Wood |
| **Climate** | How do we heat, cool, and condition air? | Teal |
| **Communication** | How do we stay connected off-grid? | Purple |
| **Fabrication** | How do we make and repair things? | Orange/Rust |
| **Transport** | How do we move people and goods? | Red |

### Workshop Mapping

**Energy**
- Intro: A Gentle Introduction to Off-Grid Power
- Applied: Off-Grid Monitoring (energy telemetry focus)
- Future: Solar Charging Systems, Battery Basics, Gravity Storage

**Water**
- Future: Biochar Water Filters, Rainwater Collection, Water Level Monitoring, Hand Pumps

**Food**
- Future: Building a Cob Oven, Fermentation Basics, Season Extension, Solar Dehydrator

**Shelter**
- Intro: DIY Bike Trailers (structural framing principles)
- Future: Shed Framing, Cold Frames, Tiny House Basics, Insulation Techniques

**Climate**
- Intro: DIY Air Filtration (Corsi-Rosenthal box)
- Applied: DIY CO2 Monitoring
- Future: Heating Small Spaces, Passive Cooling, Rocket Stoves

**Communication**
- Intro: Easy Off-Grid Mesh Radio (Meshtastic)
- Applied: Off-Grid Telemetry
- Advanced: Building a DIY 4G Phone
- Future: GMRS Basics, Ham Radio Intro, SDR Listening, Satellite Communication

**Fabrication**
- Future: Introduction to Welding, Intro to Sandcasting, Wire Sculpture, Soldering Basics, Tool Sharpening

**Transport**
- Intro: DIY Bike Trailers
- Future: Bike Maintenance Basics, Cargo Bike Conversion, E-Bike Basics

Note: Some workshops may appear in multiple foundations (e.g., Bike Trailers touches both Shelter and Transport). That's fine—cross-list them.

---

## Workshop Depth Levels

Each foundation can have workshops at multiple levels:

| Level | Format | Price Range | Description |
|-------|--------|-------------|-------------|
| **Intro** | 2-hour workshop | $55–75 | Accessible entry point, basic take-home project |
| **Applied** | 2-hour workshop | $95–115 | Builds on intro, functional take-home device |
| **Advanced** | Half-day or multi-session | $150–200 | Deeper build, more complex project |
| **Part 2** | 2-hour follow-up | $40 | For people who took the intro/applied, bring your project back |

---

## The Resilience Sequence

A 4-week cohort program covering one workshop from each of 4 different foundations. Runs on a seasonal rotation.

### Structure
- Week 1: Energy
- Week 2: Climate or Water
- Week 3: Communication
- Week 4: Fabrication or Transport

### Pricing
- À la carte total: ~$320
- Bundle price: $275
- Early bird (3+ weeks ahead): $250

### Seasonal Rotation (Example)

| Season | Energy | Climate/Water | Communication | Fabrication/Transport |
|--------|--------|---------------|---------------|----------------------|
| **Winter 2026** | Off-Grid Power | Air Filtration | Mesh Radio | Bike Trailers |
| **Spring 2026** | Solar Charging | Water Collection | GMRS Basics | Bike Maintenance |
| **Summer 2026** | Battery Basics | Passive Cooling | Ham Radio Intro | Welding Intro |
| **Fall 2026** | Gravity Storage | Biochar Filters | SDR Listening | Sandcasting |

### Completion Credentials

| Credential | Requirement |
|------------|-------------|
| **Resilience Foundations** | Complete 1 seasonal sequence (4 workshops) |
| **Resilience Practitioner** | Complete 2 sequences (8 workshops across 4+ foundations) |
| **Resilience Instructor** | Complete all 4 seasons + demonstrate teaching competency |

---

## Proposed Site Structure

```
/
├── index.html (homepage - reframed)
├── /foundations/
│   ├── index.html (overview of all 8 foundations)
│   ├── /energy/
│   │   └── index.html (foundation page with workshops listed)
│   ├── /water/
│   ├── /food/
│   ├── /shelter/
│   ├── /climate/
│   ├── /communication/
│   ├── /fabrication/
│   └── /transport/
├── /resilience-sequence/
│   ├── index.html (program overview)
│   ├── /winter-2026/
│   └── /alumni/ (future)
├── /workshops/
│   └── (existing workshop pages - keep as-is for now)
├── /events/
│   └── (existing event pages - keep as-is)
└── /about/
```

---

## Homepage Reframe

Current homepage is a flat list of workshops. New homepage should:

1. **Hero section:** "Learn practical resilience skills" with brief manifesto
2. **Featured:** Current Resilience Sequence with dates and CTA
3. **Browse by Foundation:** 8 cards linking to foundation pages
4. **Upcoming Drop-In Workshops:** Calendar/list of next 4-6 workshops
5. **The Vision:** Brief section on the larger curriculum we're building

---

## Individual Foundation Page Template

Each foundation page (e.g., `/foundations/communication/`) should include:

1. **Title and tagline** (e.g., "Communication: How do we stay connected off-grid?")
2. **Why this matters** (2-3 paragraphs on the importance of this skill area)
3. **Learning pathway** (visual or list showing Intro → Applied → Advanced progression)
4. **Current workshops** (workshops we're actively offering)
5. **Coming soon** (workshops in development)
6. **Resources** (books, links, projects for self-directed learning)
7. **Related foundations** (e.g., Communication relates to Energy for powering radios)

---

## Tasks

### Phase 1: Structure (do first)
- [ ] Create `/foundations/` landing page with 8 foundation cards
- [ ] Create template for individual foundation pages
- [ ] Create `/foundations/communication/` as first example (most content ready)
- [ ] Create `/foundations/energy/` as second example
- [ ] Create `/resilience-sequence/` landing page
- [ ] Create `/resilience-sequence/winter-2026/` with specific dates

### Phase 2: Content Migration
- [ ] Add foundation tags/frontmatter to existing workshop pages
- [ ] Create foundation pages for remaining 6 foundations
- [ ] Cross-link workshops to their foundation pages

### Phase 3: Homepage
- [ ] Redesign homepage with new structure
- [ ] Add foundation browse section
- [ ] Feature Resilience Sequence prominently

### Phase 4: Polish
- [ ] Consistent styling across foundation pages
- [ ] Navigation updates (add Foundations and Resilience Sequence to nav)
- [ ] Mobile responsiveness check

---

## Design Notes

The current site has a nice outdoorsy, hand-drawn, field-guide aesthetic. Maintain this. Specifically:

- Paper/natural background textures
- Earthy color palette (greens, browns, ambers)
- Monospace or typewriter-style fonts for that DIY feel
- Hand-drawn icons or illustrations where possible
- Minimal, functional layout—not slick/corporate

Each foundation could have its own accent color (see table above) while staying within the overall palette.

---

## Content to Write

### Foundation Overview Copy (for /foundations/ landing page)

> Waterbear Field School organizes learning around eight foundations—the essential systems that sustain households and communities. Each foundation contains workshops ranging from accessible introductions to advanced builds. Take them individually, or join a Resilience Sequence to work through multiple foundations with a cohort.

### Resilience Sequence Copy (for /resilience-sequence/)

> The Resilience Sequence is a 4-week cohort program covering energy, climate, communication, and making. Each season features different workshops, so you can return and build new skills year-round. Complete a sequence and join our alumni community. Complete all four seasons and you'll have touched every foundation.

### Individual Foundation Intros

These need to be written for each of the 8 foundations. Example for Communication:

> **Communication: How do we stay connected off-grid?**
>
> When the internet goes down or cell towers fail,�么 how do you reach your neighbors? Your family across town? Emergency services?
>
> Our communication workshops teach you to build and operate independent radio networks—mesh systems that work without infrastructure, license-free options for local coordination, and amateur radio for long-distance resilience. You'll leave with working hardware and the knowledge to deploy it.

---

## Existing Content to Preserve

Don't delete or break these existing pages:
- All `/workshops/*` pages
- All `/events/*` pages
- `/about/`
- Current `/foundations/` pages (they exist but are sparse—we're expanding them)

The goal is additive, not destructive. Build the new structure, then redirect/reorganize once it's working.

---

## Questions to Resolve

1. Should "Hospitality" and "Libraries & Learning" remain as foundations, or fold them into something else? (Current recommendation: drop them for now, revisit later)

2. Should Bike Trailers live under Shelter or Transport? (Current recommendation: cross-list in both)

3. Do we want a /calendar/ page that shows all upcoming workshops across foundations? (Probably yes, eventually)

4. How do we handle workshops that span multiple foundations in the data model? (Tags array in frontmatter?)

---

## Reference

- Live site: https://waterbearfieldschool.org/
- Current foundations page: https://waterbearfieldschool.org/foundations/
- Pricing discussion: workshops range $55-115, Resilience Sequence bundle $275

---

## Notes for Claude Code

This is an 11ty static site. When creating new pages:

1. Follow the existing frontmatter patterns in other pages
2. Use Markdown with YAML frontmatter
3. Check `_includes/` for existing templates/layouts
4. Check `_data/` for any shared data files
5. Maintain the existing CSS approach (check for SCSS or CSS files)

Start by exploring the repo structure before making changes. Create new files rather than modifying existing ones until we're confident in the new structure.
