// Directory data for session recaps (src/sessions/*.md).
//
// One markdown file per Field Day that has actually happened. The file owns the
// narrative and the photo list; everything visual (colour, fallback image,
// category name) is derived here from the `workshop` slug, so a recap never has
// to repeat what workshops.js already knows — and never drifts from it.
//
// Three traps, all hit while building this:
//
//   * `fileSlug` and `filePathStem` BOTH strip a leading YYYY-MM-DD from the
//     filename, so 2026-08-25-woodworking.md and 2026-08-20-woodworking.md both
//     reduce to "woodworking" and would fight over one URL. `inputPath` is the
//     only field that keeps the date.
//
//   * Defining `permalink` here OVERRIDES the global draft handling in
//     .eleventy.js for these pages, so the draft check is repeated below.
//     Without it every unfinished stub publishes.
//
//   * It also overrides `permalink: false` set in a file's own front matter
//     (README.md), so that is honoured explicitly too.
const path = require("path");
const workshops = require("../_data/workshops.js");

const bySlug = Object.fromEntries(workshops.map((w) => [w.slug, w]));
const slugOf = (data) => path.basename(data.page.inputPath, ".md");

module.exports = {
  tags: "session",
  layout: "session.njk",

  eleventyComputed: {
    sessionSlug: slugOf,

    permalink: (data) => {
      if (data.draft) return false;            // stub, not ready to publish
      if (data.permalink === false) return false; // e.g. README.md
      return `/s/${slugOf(data)}/`;
    },

    photoDir: (data) => `/assets/images/sessions/${slugOf(data)}/`,

    color: (data) => (bySlug[data.workshop] || {}).color || "#1c4d3a",
    categoryLabel: (data) => (bySlug[data.workshop] || {}).title || "Field Day",
    // short form for the pill on a card — the full title ("Solar Power &
    // Electronics Bench") wraps to two lines and swamps a small tile
    categoryShort: (data) =>
      (bySlug[data.workshop] || {}).short ||
      (bySlug[data.workshop] || {}).title ||
      "Field Day",
    // what the card and the page call this session: its own project if it has
    // one, otherwise the category title. Solar days have no distinct project,
    // so without this their cards render with a pill and no heading.
    heading: (data) =>
      data.project || (bySlug[data.workshop] || {}).title || "Field Day",
    // "Tue · Aug 25" -> "Aug 25", for labels that already carry a separator
    dayShort: (data) => (data.day || "").replace(/^[^·]*·\s*/, ""),
    // the session's own image if it has one, else the category's
    img: (data) => data.img || (bySlug[data.workshop] || {}).img,
    // card text: the session's summary if written, else the category blurb
    cardText: (data) => data.summary || (bySlug[data.workshop] || {}).blurb || "",
  },
};
