// Field Day CATEGORIES.
//
// A category carries the shared identity of a strand of Field Days: its colour,
// stock image, summary, and the defaults a session inherits when it does not
// say otherwise (about, forWhom, bring, location).
//
// It does NOT list its days. Each Field Day is one markdown file in
// src/sessions/, and _data/sessions.js flattens those into the schedule. That
// used to live here as a nested `sessions` array, which meant every day's
// facts existed in two places; adding a day now means adding a file.
//
// A category page (/w/<slug>/) finds its days with the `forWorkshop` filter.

module.exports = [
  {
    slug: "water",
    cartShort: "Water",
    title: "Working with Water",
    short: "Water",
    color: "#2c8299",
    img: "/v6img/ws-rain.jpg",
    blurb: "Catching rain, moving it, and cleaning it \u2014 the plumbing and practice of making water useful at home and on the farm.",
    about: [
      "Rain that lands on a roof is the easiest water you will ever get, and most of it runs straight into a drain. We look at how to catch it, hold it, and get it where it is wanted.",
      "Hands on the actual fittings: downspouts, diverters, overflow, and the small number of parts that do most of the work."
    ],
    forWhom: "Adults and kids 6+ (an adult caregiver needs to accompany kids under 14).",
    bring: "Closed\u2011toe shoes and weather\u2011appropriate clothing. Tools and parts are provided.",
    location: "Hanan Healthy Foods, Lincoln, MA",
    locationNote: "Exact address sent when you register."
  },
  {
    slug: "solar",
    cartShort: "Solar Bench",
    title: "Solar Power & Electronics Bench",
    short: "Solar",
    color: "#2f5a92",
    img: "/v6img/ws-solar.jpg",
    blurb: "Learn the basics of electricity by hooking up small solar panels, lights, batteries, and motors, and measuring voltage, current, and resistance with a multimeter.",
    about: [
          "We start from the very beginning — what a volt is, what a battery actually does — and build up, part by part, hooking up small solar panels, lights, batteries, and motors.",
          "Along the way you'll get comfortable with a multimeter, measuring voltage, current, and resistance for yourself. Nothing is a black box: by the end you'll understand every wire."
    ],
    forWhom: "Adults and kids 6+ (an adult caregiver needs to accompany kids under 14)",
    bring: "Just yourself — tools and parts are provided.",
    location: "Lincoln Park, Somerville",
    locationNote: "Exact address sent when you register.",
  },
  {
    slug: "woodworking",
    cartShort: "Woodworking",
    title: "Woodworking",
    short: "Woodworking",
    color: "#a86f28",
    img: "/v6img/pg-wood.jpg",
    blurb: "Use simple hand tools to build useful objects like a portable work bench, a toolbox, a birdbox, an easel, a bench.",
    about: [
          "Use simple hand tools to build useful, real objects — and take your work home.",
          "You'll learn to measure, cut, and join, at a pace that works for first‑timers and kids alike."
    ],
    forWhom: "Adults and kids 6+ (an adult caregiver needs to accompany kids under 14). Good for first‑timers.",
    bring: "Closed‑toe shoes. Tools and wood are provided.",
    location: "Lincoln Park, Somerville",
    locationNote: "Exact address sent when you register.",
  },
  {
    slug: "music",
    cartShort: "Instrument Making",
    title: "Music & Instrument Making",
    short: "Music",
    color: "#7b6bb5",
    img: "/v6img/pg-music.jpg",
    blurb: "Learn to build and play simple instruments together.",
    about: [
          "Part jam session, part workshop: we build simple instruments from everyday materials, then play them together.",
          "No musical background needed — the point is to make sound, make something, and have fun doing it as a group."
    ],
    forWhom: "All ages welcome (an adult caregiver needs to accompany kids under 14).",
    bring: "An instrument if you have one — otherwise we'll make some.",
    location: "Lincoln Park, Somerville",
    locationNote: "Exact address sent when you register.",
  },
  {
    slug: "zines",
    cartShort: "Zines",
    title: "Zines & Printmaking",
    short: "Zines",
    color: "#b0413e",
    img: "/v6img/ws-zines.png",
    blurb: "Make small zines and booklets using simple needle-and-thread binding, and learn how to lay out your material so your zines are easy to print.",
    about: [
          "We'll use simple needle-and-thread binding techniques to make small zines and booklets you can take home.",
          "Along the way you'll learn how to lay out your material so zines are easy to print — and easy to share."
    ],
    forWhom: "All ages welcome (an adult caregiver needs to accompany kids under 14). No experience needed.",
    bring: "Just yourself — paper, needles, thread, and printing materials are provided.",
    location: "Lincoln Park, Somerville",
    locationNote: "Exact address sent when you register.",
  },
  {
    slug: "plant-id",
    cartShort: "Plant ID",
    title: "Plant ID & Mapping",
    short: "Plant ID",
    color: "#3f7d54",
    img: "/v6img/pg-nature.jpg",
    blurb: "Learn the names of some of the trees and plants around you, and how to read, use, and make maps.",
    about: [
          "A walking session: we learn the names of the trees and plants around us — how to tell them apart, and what people have used them for over time.",
          "We'll also learn to read and use maps of where we are, and start making our own. Bring your curiosity and comfortable shoes."
    ],
    forWhom: "All ages welcome (an adult caregiver needs to accompany kids under 14).",
    bring: "Comfortable walking shoes, water, and weather‑appropriate clothing.",
    location: "Umbrello Hay Field, Lincoln, MA",
    locationNote: "Meeting spot sent when you register.",
  },
];
