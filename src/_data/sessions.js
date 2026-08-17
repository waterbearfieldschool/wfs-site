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
        emoji: w.emoji,
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
      };
    })
  )
  .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
