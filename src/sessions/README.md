---
permalink: false
eleventyExcludeFromCollections: true
---

# Field Days

One markdown file per Field Day, named `YYYY-MM-DD-<workshop-slug>.md`.
**This is the only place a Field Day is defined.**

The filename sets the date. `_data/sessions.js` reads these files to build the
schedule, the registration pages, the cart lines and the confirmation emails;
`workshops.js` supplies only the category defaults a session doesn't override.

## The life of a file

**Before the day** — front matter only. It appears on the schedule and is
registerable. Keep `draft: true`, which holds back the write-up page but not the
Field Day itself.

**After the day** — set `happened: true`, drop the photo filenames into
`photos:`, write a line of `summary:` and a couple of paragraphs in the body,
and remove `draft: true`. It now appears under Recent Field Days with its own
page at `/s/<filename>/`.

Photos live in `src/assets/images/sessions/<same-name-as-this-file>/`.

## Capacity

`capacity:` and `minToRun:` are authored here but enforced in Postgres —
`register()` counts and inserts under a row lock, which is what stops two people
taking the last place at once. `deploy.sh` runs `wfs-sync-caps --apply` to push
your value across. You never write SQL for this.

## Adding a file? Restart the dev server

`_data/sessions.js` reads this directory once, when Node first requires it.
Eleventy's watcher reloads templates but not that cached module, so **a brand
new session file will not appear on the dev server until you restart it**. The
day simply will not be there, which looks like the file being wrong.

Editing an existing file's front matter has the same problem. `npm run build`
is a fresh process and always sees everything.

## Gotchas

- The `date:` field is for reading. **The filename is authoritative** — YAML
  turns an unquoted date into a timezone-shifted `Date`.
- `draft: true` hides the write-up, *not* the Field Day.
- `happened: false` keeps a cancelled day out of Recent Field Days without
  deleting the file.
- Changing `project:` changes the label that `register()` writes to `rsvps` —
  the sync keeps `session_caps` in step, and `wfs-check` fails the deploy if
  anything drifts.
