// Flattened, chronological list of every upcoming Field Day session —
// derived from workshops.js. Each session is the primary unit of content:
// it resolves its own project, blurb, description, facts, and materials,
// falling back to the category (workshop) defaults where a session omits them.
const workshops = require("./workshops.js");

module.exports = workshops
  .flatMap((w) =>
    w.sessions.map((s) => {
      const project = s.project || w.title;
      const about = s.about || w.about;
      return {
        slug: w.slug,
        category: w.title,
        short: w.short || w.title,
        topic: w.title,
        color: w.color,
        img: s.img || w.img,
        date: s.date,
        day: s.day,
        time: s.time,
        place: s.place,
        project: s.project || null,
        title: project,
        about: about,
        cardBlurb: (s.about && s.about[0]) || w.blurb,
        forWhom: s.forWhom || w.forWhom,
        bring: s.bring || w.bring,
        location: s.location || w.location,
        locationNote: s.locationNote || w.locationNote,
        // value stored in the rsvps.session column:
        label: `${s.day} — ${project}`,
        materials: s.materials || null,
        // display name for the kit, from materials.label:
        //   "a toolbox" -> "Toolbox", "solar panel + motor kit" -> "Solar panel + motor kit"
        kitName: s.materials
          ? (function (l) {
              var s2 = l.replace(/^(a|an|the)\s+/i, "");
              return s2.charAt(0).toUpperCase() + s2.slice(1);
            })(s.materials.label)
          : null,
        // short forms, for cart lines where the full title wraps:
        //   day     "Thu · Aug 20"      ->  dayShort "Aug 20"
        //   title   "Build a Toolbox"   ->  cartName "Toolbox · Aug 20"
        dayShort: s.day.replace(/^[^·]*·\s*/, ""),
        cartName: `${s.shortTitle || w.cartShort || w.short || w.title} · ${s.day.replace(/^[^·]*·\s*/, "")}`,
        // shareable page for this specific day:
        path: `/w/${w.slug}/${s.date}/`,
      };
    })
  )
  .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
