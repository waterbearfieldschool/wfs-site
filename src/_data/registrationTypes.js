// Registration types. Order matters — the first is listed first, so the paid
// option leads and the free one is a deliberate choice rather than the default.
// `price` is a fallback; a session can override its standard price with
// `ticketPrice` in workshops.js.
module.exports = [
  { id: "standard",  label: "Standard",          price: 20,
    blurb: "Covers materials and keeps the day running." },
  { id: "supporter", label: "Supporter",         price: 40,
    blurb: "Covers your spot and quietly pays for someone else's." },
  { id: "free",      label: "Pay what you can",  price: 0,
    blurb: "No questions asked. Please take this one if the cost would keep you away." },
];
