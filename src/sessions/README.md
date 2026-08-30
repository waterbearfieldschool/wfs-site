# sessions/

One markdown file per Field Day. **A session lives its whole life in one file:**
it starts as an upcoming date, the day happens, and then the same file gains
photos and a few paragraphs. Same URL throughout — so a link someone shared in
WhatsApp still works, and still shows the right preview.

Filename is `YYYY-MM-DD-<workshop>.md`.

## Front matter

Set when the session is scheduled:

    date, day, time      when
    workshop             which workshop (matches _data/workshops.js)
    category             forest | workshop | papercraft
    project              this day's sub-topic, if it differs from the workshop
    shortTitle           short form for cart lines
    place, img, materials

Filled in afterwards:

    happened: true       false if it didn't run
    photos: []           filenames, in the order they should appear

## Body

`## What we did` — two or three paragraphs.
`## Notes for next time` — optional, and for you rather than for visitors.

## Photos

Drop them in `~/iris/journal/inbox/photos/<YYYY-MM-DD-workshop>/` — the
Syncthing folder. They get resized, stripped of EXIF (iPhone photos carry GPS,
and the address is the thing registration buys) and copied into
`src/assets/images/sessions/<same-name>/`.

## Status

These files are **not wired into the build yet**. The live site still renders
from `_data/workshops.js`. Filling these in is safe and changes nothing until
the restructure lands.
