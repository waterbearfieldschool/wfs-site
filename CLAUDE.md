# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Waterbear Field School website - a static site built with Eleventy (11ty) using Nunjucks templating.

## Commands

- **Development server**: `npm run dev` (starts at http://localhost:8080 with hot reload)
- **Production build**: `npm run build` (outputs to `_site/`)
- **Deploy**: `./deploy.sh` (builds, copies to GitHub Pages repo, and pushes)

## Architecture

### Directory Structure
```
src/
├── _data/site.json      # Global site data (title, description, links)
├── _includes/layouts/   # Nunjucks templates (base.njk, post.njk, home.njk, list.njk)
├── assets/              # Static files (css, images, docs) - passed through to _site/assets
├── index.njk            # Homepage
├── workshops/           # Workshop content (each in own folder with .md file)
├── foundations/         # Foundation topic content
├── events/              # Event pages
├── projects/            # Project pages
└── contact/             # Contact page
```

### Eleventy Configuration (.eleventy.js)

Key collections defined:
- `allEvents`: Events sorted reverse chronologically
- `recentEvents`: Projects sorted reverse chronologically
- `allWorkshops`: Workshops sorted alphabetically by title
- `allFoundations`: Foundations sorted alphabetically by title

Custom filter:
- `isUpcoming`: Checks if event date is in the future

### Content Files

Markdown files use YAML front matter:
```yaml
---
title: "Page Title"
meta: Short description for meta tags
layout: layouts/post.njk
permalink: /path/to/page/
---
```

### Layout Inheritance

`post.njk` extends `base.njk` - use `layouts/post.njk` for content pages.
