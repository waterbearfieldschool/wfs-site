# snipcart-webhook

Snipcart POSTs completed orders here, and this writes the registrations.

## Why

A paid registration is otherwise written by JavaScript in the buyer's browser
when Snipcart confirms the cart. Close the tab on the confirmation screen and
Snipcart has the money while Supabase has no record — silently, with nothing
to detect it afterwards. Snipcart posts here from its own servers, with
retries, so the registration lands either way.

It is a **backstop**, not a replacement. The browser write still happens and is
faster; whichever arrives first wins and the other is skipped, matched on
`order_token` + `session_date`.

## Why an Edge Function rather than a Cloudflare Worker

A Worker would need two secrets: the Snipcart key to validate the request, and
the Supabase key to write. An Edge Function is already inside Supabase, so it
needs only the Snipcart one. Fewer copies of a key that can move money.

## Deploy

```bash
# from the repo root
supabase login
supabase link --project-ref jhgcnqmzbphzpxgtojti

# The Snipcart SECRET key. Set here, not in the repo, and not in pass on the Pi
# — nothing outside Supabase needs a copy.
supabase secrets set SNIPCART_SECRET=...

supabase functions deploy snipcart-webhook --no-verify-jwt
```

`--no-verify-jwt` is required: Snipcart sends its own request token, not a
Supabase JWT. Authentication is the token check inside the function, which asks
Snipcart's API whether the request is genuine — so the endpoint being public
does not make it open.

Then in the Snipcart dashboard, add the function URL as a webhook:

```
https://jhgcnqmzbphzpxgtojti.supabase.co/functions/v1/snipcart-webhook
```

## Testing it

Place a test order and check:

```bash
wfs-roster --day <date>          # the row should be there
supabase functions logs snipcart-webhook
```

The log line says which path won: `registered` (the webhook got there first, so
the browser write failed or the tab was closed) or `already-recorded` (the
browser won, and the backstop correctly did nothing).

`already-recorded` on every normal order is the expected steady state. The
webhook earns its keep only on the orders where something went wrong — which
is exactly why it can't be tested by watching it succeed.
