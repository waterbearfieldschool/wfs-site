# Field Day registration — how it works, and how to add a day

*Written 2026-08-25, the day it went live.*

Two halves. **Part 1** explains the machine and why it's shaped the way it is.
**Part 2** is the practical bit: adding a Field Day, changing prices, cancelling.
If you only need to add a workshop, skip to Part 2.

---

# Part 1 — the architecture

## The shape of it

Three pieces, with a deliberate division of labour:

| | what it holds | why it's there |
|---|---|---|
| **Eleventy** (this repo) | every page, all workshop content | static, free to host, nothing to break |
| **Supabase** (Postgres) | registrations, capacity, and the rules | somewhere trustworthy to *enforce* things |
| **Snipcart** | payments only | taking card details is not a thing to build yourself |

The important idea: **Snipcart is a payment step, not the system.** An earlier
version made Snipcart the shopping basket, which meant a free registration had
to walk through a checkout to be recorded. Now the basket is ours, in
`localStorage`, and Snipcart is only involved when money is.

## The two paths

**Free.** Someone picks "Pay what you can", it lands in our basket, they open
the basket, give a name and email, and it goes straight to Supabase. No
checkout, no card fields, no billing address. Two fields and a button.

**Paid.** Same basket, but the total is above zero, so the paid lines are
handed to Snipcart and its checkout takes over. When the order confirms, the
registration is written from our basket — including any free lines riding
along in the same order.

A basket containing both goes down the paid path, and everything in it is
recorded together.

## Where each piece of state lives

- **The basket** — `localStorage`, key `wfs.basket.v1`. Only in the visitor's
  browser; nothing is recorded until they finish.
- **Who they are** — `localStorage`, key `wfs.who.v1`, so a second registration
  is quicker. A convenience, never a source of truth.
- **The registration** — the `rsvps` table. This is the record.
- **The money** — Snipcart's order, mirrored into `rsvps` (see below).

## The database

**`rsvps`** — one row per person-per-day:

```
id · name · email · session · session_date · party_size · kit_count
wants_updates · wants_materials
tier · amount_paid · kit_amount · order_token      -- the money, mirrored
confirmation_sent_at                                -- stamped when emailed
created_at
```

The money columns exist so Supabase alone can answer "what is this person
owed?" without opening orders in Snipcart one at a time. Before they existed, a
per-day refund meant manual archaeology.

**`session_caps`** — `date · label · capacity · min_to_run`. Capacity lives
here, not in `workshops.js`, because it has to be enforced somewhere that can't
be edited by the visitor.

**`session_counts`** — a public view: date, capacity, taken, remaining. This is
what draws "10 spots left". Aggregates only, no personal data, safe to read
anonymously.

**`refundable`** — what a cancellation needs: who, which day, and the amount.
Secret-key only; it carries names and emails.

## `register()` — the only door

Registration does **not** insert into `rsvps`. Anonymous insert is revoked.
Everything goes through one Postgres function, which in order:

1. refuses a day in the past *(America/New_York, not UTC — `current_date`
   would close registration at 8pm the evening before)*
2. checks the party size and the email look sane
3. refuses a duplicate — same email, same day, inside ten minutes
4. rate-limits: 10 per email per hour, 100 overall per hour
5. takes a **row lock** on the day, counts who's already registered, and
   refuses if it would overfill
6. inserts

Step 5 is the point of the whole design. Counting and inserting happen inside
one locked transaction, so two people clicking at the same moment cannot both
take the last spot. A check in the browser can't do that, and a browser can be
edited anyway.

It returns `{ok: true, remaining: n}` or `{ok: false, reason: "..."}` where the
reason is one of `past`, `bad_party`, `bad_details`, `bad_kits`, `duplicate`,
`rate_limited`, `too_busy`, `unknown_session`, `full`.

**`p_meta` is a jsonb bag** rather than more arguments. Adding a positional
argument means dropping and recreating the function, which breaks every caller
until they're updated — that happened twice before this. Now a new field is one
column and one line, and nothing else changes.

## The webhook backstop

A paid registration is written by JavaScript in the buyer's browser when
Snipcart confirms the cart. If they close the tab at that moment, Snipcart has
their money and Supabase has no record, silently.

So Snipcart also POSTs the completed order to a Supabase Edge Function
(`supabase/functions/snipcart-webhook`), from its own servers, with retries.
It writes the same registration — unless one already exists for that
`order_token` and date, in which case it stands down.

On a normal order the browser wins and the log says `already-recorded`. **The
webhook doing nothing is the correct outcome most of the time.** It only earns
its keep on the orders that went wrong, which is also why you can't test it by
watching it succeed — to exercise it, block the browser's write and check out.

It authenticates by asking Snipcart's API whether the request token is genuine,
so the URL being public doesn't make it open.

## Confirmation emails

Nothing in Snipcart emails a free registrant, and the address of a Field Day is
deliberately withheld until someone registers — so without this, registering
tells a person nothing they can act on.

`scripts/wfs-confirm` runs on the Pi every five minutes from cron. It finds
rows with no `confirmation_sent_at`, sends each person their details, and
stamps the row so a rerun can't double-send. Session details are read live from
`sessions.js`, so the email can't drift from the page they registered on;
addresses come from a private file that is not in this repo.

## Keys, and where they live

| key | where | what it can do |
|---|---|---|
| Supabase **publishable** | in the page source | call `register()`, read `session_counts`. Nothing else. |
| Supabase **secret** | `pass supabase/wfs-secret` on the Pi | read and write everything. Used by the scripts. |
| Snipcart **public (live)** | `site.json`, in the page | start a checkout |
| Snipcart **secret (live)** | Supabase function secrets | validate webhooks. Never on the Pi, never in this repo. |
| Supabase CLI token | `pass supabase/cli-token` | deploy functions |

Two things learned the hard way:

- **Snipcart's test and live keys must match across both places.** The public
  key here and `SNIPCART_SECRET` in Supabase. Mismatch them and every webhook
  is rejected — checkout still works, the browser still records, and the
  backstop is quietly dead with nothing to show for it.
- **`1068235b-…` is the LIVE key.** It is also what `edge-blog` uses to take
  real money. It should never appear on an unlisted or demo page.

## Tools

```
wfs-roster     who has registered; --day, --pending, --mask
wfs-confirm    send confirmation emails; --dry-run, --test-to
wfs-check      catch drift between the site's days and session_caps
wfs-edit       guarded git pull/push for this repo
./deploy.sh    check, build clean, publish
```

`deploy.sh` runs `wfs-check` and **refuses to publish** if a day has no
capacity row. It also wipes `_site` before building — Eleventy doesn't clean
between builds, and output from deleted templates has survived and been
published before.

---

# Part 2 — adding a Field Day

Three steps. The second is easy to forget and the site will not warn you at
authoring time — but `deploy.sh` will refuse to publish, which is the safety
net.

## 1. Add the session in `src/_data/workshops.js`

Find the workshop (the *category* — Woodworking, Solar) and add a session to
its `sessions` array:

```js
{ date: "2026-09-04",              // ISO. This is the identity of the day.
  day: "Fri · Sep 4",              // shown everywhere
  time: "10 AM–1 PM",
  place: "Lincoln Park, Somerville",
  project: "Build a Birdbox",      // optional: this day's specific project
  shortTitle: "Birdbox",           // optional: short form for cart lines
  img: "/v6img/ws-birdbox.jpg",    // optional: falls back to the category image
  about: [                         // optional: falls back to the category text
    "First paragraph.",
    "Second paragraph.",
  ],
  materials: { label: "a birdbox", fee: 30 },   // or null for no kit
},
```

Only `date`, `day`, `time`, `place` and `materials` are required — everything
else inherits from the category.

**A new location?** Add the real address to `~/iris/private/wfs-addresses.json`
too, keyed by the exact `place` string. `wfs-confirm` refuses to email about a
session whose address it doesn't have, rather than sending someone a Field Day
with no location.

## 2. Add the capacity row

In the Supabase SQL editor. The `label` must match exactly what the site
generates — `"<day> — <project or category title>"`:

```sql
insert into public.session_caps (date, label, capacity, min_to_run)
values ('2026-09-04', 'Fri · Sep 4 — Build a Birdbox', 10, 3)
on conflict (date) do update
  set label = excluded.label, capacity = excluded.capacity;
```

**If you skip this, the day looks completely normal and every registration is
refused** with `unknown_session`. Nobody finds out until someone tries. Run
`wfs-check` and it will tell you the exact label to use.

## 3. Check, then deploy

```bash
wfs-check      # sessions vs session_caps, both directions
./deploy.sh "add Sep 4 birdbox"
```

`deploy.sh` runs the check itself and stops if anything is wrong.

Then look at the live page: the day should appear with "10 spots left".

## Changing things

**Prices** — `src/_data/registrationTypes.js`, then deploy. Currently $20
standard, $40 supporter, free.

**Kit price** — the session's `materials.fee` in `workshops.js`, then deploy.

**Capacity** — a `session_caps` row. No deploy needed; the page reads it live.

**Renaming a project** — change it in `workshops.js` *and* update the matching
`session_caps.label`. `register()` writes `rsvps.session` from the caps row, so
if they drift your roster describes the day differently from the site.
`wfs-check` catches this.

## Cancelling a day

1. `wfs-roster --day 2026-09-04` — who's affected
2. For anyone who paid, refund in Snipcart. `select * from refundable where
   session_date = '2026-09-04'` gives the exact amount per person, so you don't
   have to work it out from the orders. **Partial-refund only the lines for
   that day** — one order can contain several days.
3. Email them
4. Delete the rows, or blank their `session_date`, to free the spots

## Known gaps

- **No self-service cancellation.** Someone who can't come replies to the
  confirmation email, and you sort it by hand. At ten people a day that's
  fine; past that it leaks capacity.
- **`min_to_run` is stored and unused.** No "needs 2 more to run" yet.
- **The paid path has never run on the live key.** It completed three times in
  test mode; only the key differs.
- **Registration needs JavaScript.**
- **A spot isn't held during checkout.** Two people can be mid-payment for one
  remaining place. At this scale, acceptable.
