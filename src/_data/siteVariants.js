// The homepage is rendered once per variant, so alternatives can be compared
// without maintaining two copies of the page.
//
//   hybrid    (/)    live. Our own basket; an all-free order goes name+email
//                    straight to Supabase and never touches Snipcart, and only
//                    a basket with money in it reaches checkout.
//   ticketed  (/v2/) the Eventbrite-shaped alternative, kept unlisted as a
//                    reference and because the link has been shared.
module.exports = [
  { key: "hybrid",   permalink: "/",    ticketed: true, hybrid: true },
  { key: "ticketed", permalink: "/v2/", ticketed: true },
];
