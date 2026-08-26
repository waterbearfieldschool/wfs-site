// Field Day workshops.
//
// A workshop is a CATEGORY (e.g. Woodworking) with a shared emoji, color, and
// summary. Each dated SESSION under it can carry its OWN project, description,
// and materials — so two Woodworking days can be entirely different builds.
// Session fields fall back to the category defaults when omitted:
//   project  -> category `title`
//   about    -> category `about`
//   bring / forWhom / location / locationNote -> category defaults
// `materials` is set explicitly on every session ({label, fee} or null).

module.exports = [
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
      "Along the way you'll get comfortable with a multimeter, measuring voltage, current, and resistance for yourself. Nothing is a black box: by the end you'll understand every wire.",
    ],
    forWhom: "Adults and kids 6+ (an adult caregiver needs to accompany kids under 14)",
    bring: "Just yourself — tools and parts are provided.",
    location: "Lincoln Park, Somerville",
    locationNote: "Exact address sent when you register.",
    sessions: [
      { date: "2026-08-19", day: "Wed · Aug 19", time: "10 AM–1 PM", place: "Lincoln Park, Somerville",
        materials: { label: "solar panel + motor kit", fee: 25, pay: "on-site",
          note: "Free to learn! If you'd like to take home a solar panel + motor kit, please register and expect to pay $25 materials cost on-site." } },
      { date: "2026-08-26", day: "Wed · Aug 26", time: "10 AM–1 PM", place: "Lincoln Park, Somerville",
        materials: { label: "solar panel + motor kit", fee: 25, pay: "on-site",
          note: "Free to learn! If you'd like to take home a solar panel + motor kit, please register and expect to pay $25 materials cost on-site." } },
    ],
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
      "You'll learn to measure, cut, and join, at a pace that works for first‑timers and kids alike.",
    ],
    forWhom: "Adults and kids 6+ (an adult caregiver needs to accompany kids under 14). Good for first‑timers.",
    bring: "Closed‑toe shoes. Tools and wood are provided.",
    location: "Lincoln Park, Somerville",
    locationNote: "Exact address sent when you register.",
    sessions: [
      { date: "2026-08-20", day: "Thu · Aug 20", time: "10 AM–1 PM", place: "Lincoln Park, Somerville",
        project: "Build a Toolbox", shortTitle: "Toolbox", img: "/v6img/ws-toolbox.jpg",
        about: [
          "A friendly first build: a wooden toolbox to carry your tools. We'll cover measuring, sawing, drilling, and joining — the core hand-tool skills — on a project you can finish in a morning.",
          "You'll take your finished toolbox home.",
        ],
        materials: { label: "a toolbox", fee: 35, pay: "on-site",
          note: "Free to learn -- just show up!  (But if you'd like to take home a toolbox, please register so we can reserve materials for you, and expect to pay $35 on site.)" } },
      { date: "2026-08-25", day: "Tue · Aug 25", time: "10 AM–1 PM", place: "Lincoln Park, Somerville",
        project: "Build a Workbench", shortTitle: "Workbench", img: "/v6img/ws-workbench.jpg",
        about: [
          "Step up to a sturdy, portable workbench for the mobile woodshop — we'll cut, assemble, and finish it together.",
          "A bigger build; nice if you've done a little woodworking before, but beginners are welcome too.",
        ],
        materials: { label: "a workbench", fee: 35, pay: "on-site",
          note: "Free to learn, just show up!  If you'd like to take home your own workbench, please register in advance, and expect to pay $35 on-site for materials." } },
    ],
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
      "No musical background needed — the point is to make sound, make something, and have fun doing it as a group.",
    ],
    forWhom: "All ages welcome (an adult caregiver needs to accompany kids under 14).",
    bring: "An instrument if you have one — otherwise we'll make some.",
    location: "Lincoln Park, Somerville",
    locationNote: "Exact address sent when you register.",
    sessions: [
      { date: "2026-08-21", day: "Fri · Aug 21", time: "10 AM–1 PM", place: "Lincoln Park, Somerville",
        materials: { label: "an instrument", fee: 15, pay: "on-site",
          note: "Free to learn!  If you'd like to take home an instrument, please register in advance, and expect to pay $15 on-site." } },
    ],
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
      "Along the way you'll learn how to lay out your material so zines are easy to print — and easy to share.",
    ],
    forWhom: "All ages welcome (an adult caregiver needs to accompany kids under 14). No experience needed.",
    bring: "Just yourself — paper, needles, thread, and printing materials are provided.",
    location: "Lincoln Park, Somerville",
    locationNote: "Exact address sent when you register.",
    sessions: [
      { date: "2026-08-28", day: "Fri · Aug 28", time: "10 AM–1 PM", place: "Lincoln Park, Somerville",
        materials: null },
    ],
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
      "We'll also learn to read and use maps of where we are, and start making our own. Bring your curiosity and comfortable shoes.",
    ],
    forWhom: "All ages welcome (an adult caregiver needs to accompany kids under 14).",
    bring: "Comfortable walking shoes, water, and weather‑appropriate clothing.",
    location: "Umbrello Hay Field, Lincoln, MA",
    locationNote: "Meeting spot sent when you register.",
    sessions: [
      { date: "2026-08-27", day: "Thu · Aug 27", time: "10 AM–1 PM", place: "Umbrello Hay Field, Lincoln, MA",
        bring: "A backpack, comfortable walking shoes, water, and weather\u2011appropriate clothing.",
        materials: null },
    ],
  },
];
