// Registration types. Order matters — the first is listed first, so the paid
// option leads and the free one is a deliberate choice rather than the default.
// `price` is a fallback; a session can override its standard price with
// `ticketPrice` in workshops.js.
module.exports = [
  { id: "standard",  label: "Standard",          price: 20,
    blurb: "Covers materials and keeps the day running." },
  { id: "supporter", label: "Supporter",         price: 40,
    blurb: "Covers your spot and quietly pays for someone else's." },
  // No-cost, but not nothing: instead of paying, you offer to lead a session on
  // something you know. The day page asks what, and the answer rides along on
  // the registration so we can follow it up.
  { id: "teach",     label: "Teach a session",   price: 0, teach: true,
    blurb: "Free \u2014 in exchange, tell us something you could teach one day." },
];
