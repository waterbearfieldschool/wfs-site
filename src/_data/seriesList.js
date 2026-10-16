// The Field Day categories that run as a series (see `series` in workshops.js).
// series.njk paginates over this to build one sign-up page per series.
const workshops = require("./workshops.js");
module.exports = () => workshops.filter((w) => w.series);
