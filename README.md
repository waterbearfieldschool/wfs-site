# My Site (Eleventy)

### Install
```bash
npm install
```

### Develop

```bash
npm run dev
```

This starts a local server (default [http://localhost:8080](http://localhost:8080)) and rebuilds on save.

### Build

```bash
npm run build
```

### Customize

- Edit `src/_data/site.json` for name, tagline, links.
- Write posts in `src/writing/` and projects in `src/projects/`.
- Adjust layout CSS in `src/assets/css/site.css`.
- For a more Ben‑Fry text‑first feel, replace the project cards grid with a list:
  ```css
  /* Replace .grid rules */
  .grid{display:flex; flex-direction:column; gap:10px}
  .card{border-radius:8px}
  .thumb{display:none}
  .card-content{padding:0}
  .card h3{font-size:1rem; margin:0}
  ```