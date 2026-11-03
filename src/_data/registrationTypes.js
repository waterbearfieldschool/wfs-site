// Registration types. Order matters — the first is listed first, so the paid
// option leads and the free one is a deliberate choice rather than the default.
// `price` is a fallback; a session can override its standard price with
// `ticketPrice` in workshops.js.
module.exports = [
  { id: "standard",  label: "Standard",          price: 20,
    blurb: "One registration covers your household for the day. Add everyone coming below." },
  { id: "supporter", label: "Supporter",         price: 40,
    blurb: "Covers your household and quietly pays for another family's spot." },
  // Headcount without a second charge: one paid (or teach) registration covers
  // a household, and each extra person is a $0 line so the day's capacity,
  // which register() counts as the sum of all registration lines, stays honest.
  { id: "household", label: "Each additional person", price: 0,
    blurb: "Coming together under one registration? Add one for each extra person, adult or child, so we know how many to expect. No extra cost." },
  // No-cost, but not nothing: instead of paying, you offer to lead a session on
  // something you know. The day page asks what, and the answer rides along on
  // the registration so we can follow it up.
  { id: "teach",     label: "Teach a Future Session", price: 0, teach: true,
    blurb: "Share some skill or idea with us sometime soon." },
  // Shown only on sessions with `freeOnly: true` in their front matter — a plain
  // no-cost registration with nothing attached, for days we are not asking
  // anything for.
  { id: "free", label: "Free", price: 0, freeOnly: true,
    blurb: "No cost, nothing owed \u2014 just tell us you're coming." },
];
