// Every Field Day, chronological — built from the markdown files in
// src/sessions/, one file per day.
//
// The markdown file is the single source of truth for a Field Day: its date,
// time, place, project, materials and capacity all live in its front matter.
// workshops.js supplies only CATEGORY defaults (colour, stock image, the shared
// blurb, who-it's-for, what to bring), which a session may override.
//
// Adding a Field Day is therefore: copy a file in src/sessions/, edit the front
// matter. `wfs-sync-caps` pushes the capacity to the database; deploy.sh runs it.
//
// Two things deliberately do NOT gate a session out of this list:
//   * `draft: true`  — holds back the write-up page, not the scheduled day. A
//     future Field Day has no recap yet and must still appear on the schedule.
//   * `happened`     — only decides whether it shows under Recent Field Days.
//
// The date comes from the FILENAME, not the `date:` front-matter field: YAML
// parses an unquoted date into a Date object, which then drifts by timezone.
// The filename is unambiguous, and it is also what names the photo folder.
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const workshops = require("./workshops.js");

const DIR = path.join(__dirname, "..", "sessions");
const bySlug = Object.fromEntries(workshops.map((w) => [w.slug, w]));

module.exports = fs
  .readdirSync(DIR)
  .filter((f) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(f))
  .map((file) => {
    const fm = matter.read(path.join(DIR, file)).data;
    const date = file.slice(0, 10);
    const w = bySlug[fm.workshop];
    if (!w) {
      throw new Error(
        `src/sessions/${file}: workshop "${fm.workshop}" is not in workshops.js`
      );
    }

    const project = fm.project || w.title;
    const about = fm.about || w.about;
    const img = fm.img || w.img;

    return {
      slug: w.slug,
      category: w.title,
      short: w.short || w.title,
      topic: w.title,
      color: w.color,
      img: img,
      ogImg:
        "/v6img/og/" +
        img.split("/").pop().replace(/\.[^.]+$/, "") +
        ".jpg",
      date: date,
      day: fm.day,
      time: fm.time,
      place: fm.place,
      project: fm.project || null,
      title: project,
      about: about,
      cardBlurb: (fm.about && fm.about[0]) || w.blurb,
      forWhom: fm.forWhom || w.forWhom,
      bring: fm.bring || w.bring,
      location: fm.location || w.location,
      locationNote: fm.locationNote || w.locationNote,
      // value stored in the rsvps.session column, and matched against
      // session_caps.label — wfs-check refuses a deploy if the two drift
      label: `${fm.day} — ${project}`,
      materials: fm.materials || null,
      // capacity lives in the database because register() enforces it under a
      // row lock; this is the authored value that wfs-sync-caps pushes there
      capacity: fm.capacity == null ? 10 : fm.capacity,
      minToRun: fm.minToRun == null ? 3 : fm.minToRun,
      // display name for the kit, from materials.label:
      //   "a toolbox" -> "Toolbox", "solar panel + motor kit" -> "Solar panel + motor kit"
      kitName: fm.materials
        ? (function (l) {
            var s2 = l.replace(/^(a|an|the)\s+/i, "");
            return s2.charAt(0).toUpperCase() + s2.slice(1);
          })(fm.materials.label)
        : null,
      // short forms, for cart lines where the full title wraps:
      //   day     "Thu · Aug 20"      ->  dayShort "Aug 20"
      //   title   "Build a Toolbox"   ->  cartName "Toolbox · Aug 20"
      dayShort: fm.day.replace(/^[^·]*·\s*/, ""),
      // month heading for the schedule list, e.g. "August" or "January 2027".
      // The year is only shown when it isn't the current one.
      month: (function (iso) {
        const d = new Date(iso + "T12:00:00");
        const name = d.toLocaleString("en-US", { month: "long" });
        return d.getFullYear() === new Date().getFullYear()
          ? name
          : `${name} ${d.getFullYear()}`;
      })(date),
      cartName: `${fm.shortTitle || w.cartShort || w.short || w.title} · ${fm.day.replace(/^[^·]*·\s*/, "")}`,
      // shareable registration page for this specific day
      path: `/w/${w.slug}/${date}/`,
      // the write-up, if one has been published
      recapPath: fm.draft ? null : `/s/${file.replace(/\.md$/, "")}/`,
    };
  })
  .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
