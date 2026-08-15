// Field Day workshop topics — drives the schedule teaser cards and the
// per-topic detail pages (/preview/w/<slug>/). Add a date to a topic's
// `sessions` array to repeat a session.
const MAIL = "mailto:info@waterbearfieldschool.org?subject=";

function reg(title, day) {
  const subj = `Register: ${title} (${day})`;
  return MAIL + encodeURIComponent(subj);
}

module.exports = [
  {
    slug: "solar",
    emoji: "☀️",
    title: "Solar Power & Electronics Bench",
    color: "#2f5a92",
    img: "/v6img/ws-solar.jpg",
    blurb: "Learn the basics of electricity by hooking up small solar panels, lights, batteries, and motors, and measuring voltage, current, and resistance with a multimeter.",
    about: [
      "We start from the very beginning — what a volt is, what a battery actually does — and build up, part by part, hooking up small solar panels, lights, batteries, and motors.",
      "Along the way you'll get comfortable with a multimeter, measuring voltage, current, and resistance for yourself. Nothing is a black box: by the end you'll understand every wire.",
    ],
    forWhom: "Adults and kids 6+ (an adult stays with under‑14s). No experience needed.",
    bring: "Just yourself. Tools, parts, and a take‑home kit are provided — chip in for materials if you can.",
    location: "Somerville, MA",
    locationNote: "Exact address sent when you register.",
    sessions: [
      { day: "Wed · Aug 19", time: "10 AM–2 PM", place: "Somerville", reg: reg("Solar Power & Electronics Bench", "Wed Aug 19") },
      { day: "Wed · Aug 26", time: "10 AM–2 PM", place: "Somerville", reg: reg("Solar Power & Electronics Bench", "Wed Aug 26") },
    ],
  },
  {
    slug: "woodworking",
    emoji: "🪚",
    title: "Woodworking",
    color: "#a86f28",
    img: "/v6img/pg-wood.jpg",
    blurb: "Use simple hand tools to build useful objects like a portable work bench, a toolbox, a birdbox, an easel, a bench.",
    about: [
      "Use simple hand tools to build useful, real objects — a portable work bench, a toolbox, a birdbox, an easel, a bench — and take your work home.",
      "You'll learn to measure, cut, and join, at a pace that works for first‑timers and kids alike.",
    ],
    forWhom: "Adults and kids 6+ (an adult stays with under‑14s). Good for first‑timers.",
    bring: "Closed‑toe shoes. Tools and wood are provided — chip in for materials if you can.",
    location: "Somerville, MA",
    locationNote: "Exact address sent when you register.",
    sessions: [
      { day: "Thu · Aug 20", time: "10 AM–2 PM", place: "Somerville", reg: reg("Woodworking", "Thu Aug 20") },
      { day: "Tue · Aug 25", time: "10 AM–2 PM", place: "Somerville", reg: reg("Woodworking", "Tue Aug 25") },
    ],
  },
  {
    slug: "music",
    emoji: "🎵",
    title: "Music & Instrument Making",
    color: "#7b6bb5",
    img: "/v6img/pg-music.jpg",
    blurb: "Learn to build and play simple instruments together.",
    about: [
      "Part jam session, part workshop: we build simple instruments from everyday materials, then play them together.",
      "No musical background needed — the point is to make sound, make something, and have fun doing it as a group.",
    ],
    forWhom: "All ages welcome (an adult stays with under‑14s).",
    bring: "An instrument if you have one — otherwise we'll make some. Materials provided; chip in if you can.",
    location: "Somerville, MA",
    locationNote: "Exact address sent when you register.",
    sessions: [
      { day: "Fri · Aug 21", time: "10 AM–2 PM", place: "Somerville", reg: reg("Music", "Fri Aug 21") },
      { day: "Fri · Aug 28", time: "10 AM–2 PM", place: "Somerville", reg: reg("Music", "Fri Aug 28") },
    ],
  },
  {
    slug: "plant-id",
    emoji: "🌿",
    title: "Plant ID & Mapping",
    color: "#3f7d54",
    img: "/v6img/pg-nature.jpg",
    blurb: "Learn the names of some of the trees and plants around you, and how to read, use, and make maps.",
    about: [
      "A walking session: we learn the names of the trees and plants around us — how to tell them apart, and what people have used them for over time.",
      "We'll also learn to read and use maps of where we are, and start making our own. Bring your curiosity and comfortable shoes.",
    ],
    forWhom: "All ages welcome (an adult stays with under‑14s).",
    bring: "Comfortable walking shoes, water, and weather‑appropriate clothing.",
    location: "Somerville, MA — Prospect Hill",
    locationNote: "Meeting spot sent when you register.",
    sessions: [
      { day: "Thu · Aug 27", time: "10 AM–12 PM", place: "Somerville (Prospect Hill)", reg: reg("Plant ID & Mapping", "Thu Aug 27") },
    ],
  },
];
