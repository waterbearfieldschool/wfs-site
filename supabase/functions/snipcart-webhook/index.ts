// Snipcart order webhook -> Supabase registrations.
//
// Why this exists: a paid registration is otherwise written by JavaScript in
// the buyer's browser when Snipcart confirms the cart. If they close the tab on
// the confirmation screen, Snipcart has their money and Supabase has no record
// — silently, with nothing to detect it afterwards. Snipcart POSTs here from
// its own servers, with retries, so the registration lands regardless.
//
// This is a BACKSTOP, not a replacement: the browser write still happens and is
// faster. Whichever gets there first wins, and the other is skipped.
//
// Deploy (from the repo root):
//   supabase secrets set SNIPCART_SECRET=...      # never committed, never on the Pi
//   supabase functions deploy snipcart-webhook --no-verify-jwt
//
// --no-verify-jwt matters: Snipcart sends its own token, not a Supabase JWT.
// Then add the function URL under Snipcart -> Webhooks.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rollUp } from "./items.ts";

const SNIPCART_SECRET = Deno.env.get("SNIPCART_SECRET") ?? "";

// Provided automatically inside an Edge Function — no key plumbing needed,
// which is the reason for hosting it here rather than on a Worker.
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/** Confirm the request really came from Snipcart, not from anyone who found
 *  the URL. Their docs have shown both auth styles over time, so try Bearer
 *  and fall back to Basic rather than assuming. */
async function tokenIsGenuine(token: string): Promise<boolean> {
  if (!token || !SNIPCART_SECRET) return false;
  const url = `https://app.snipcart.com/api/requestvalidation/${token}`;
  const attempts = [
    { Authorization: `Bearer ${SNIPCART_SECRET}` },
    { Authorization: `Basic ${btoa(SNIPCART_SECRET + ":")}` },
  ];
  for (const headers of attempts) {
    try {
      const r = await fetch(url, { headers: { ...headers, Accept: "application/json" } });
      if (r.ok) return true;
      if (r.status !== 401 && r.status !== 403) return false; // a real "no"
    } catch (_) { /* try the other style */ }
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  const token = req.headers.get("x-snipcart-requesttoken") ?? "";
  if (!await tokenIsGenuine(token)) {
    console.warn("rejected: request token did not validate");
    return new Response("unauthorized", { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return new Response("bad json", { status: 400 });

  // Only completed orders create registrations. Everything else is
  // acknowledged so Snipcart doesn't retry it forever.
  // Log every authenticated invocation. Without this a successful run leaves
  // nothing but "booted"/"shutdown" in the logs, and you end up inferring what
  // happened from timestamps — which is exactly what we had to do the first time.
  console.log(`event=${body.eventName} token=${body.content?.token ?? "-"}`);

  if (body.eventName !== "order.completed") {
    return Response.json({ ok: true, ignored: body.eventName });
  }

  const order = body.content ?? {};
  const email = order.email ?? "";
  const name = order.billingAddressName ?? order.cardHolderName ?? "";
  const orderToken = order.token ?? order.invoiceNumber ?? null;
  const items = order.items ?? [];
  if (!email) return Response.json({ ok: false, reason: "no email on order" });

  // Roll the line items up per EVENT (session key) — two events can share a
  // date. Item-id parsing, legacy ids included, lives in items.ts.
  const slots = rollUp(items);

  const results: Record<string, string> = {};

  for (const s of slots) {
    const label = s.key ?? s.date;
    if (s.party < 1) {
      // kits without a registration: nothing to record. A legacy kit id on a
      // two-event date lands here too — it can't be told which event it was.
      if (s.kits > 0) console.warn("kits with no registration", label, s);
      continue;
    }

    // Skip if the browser already recorded this order for this event. Without
    // this, a buyer who stayed on the page would be registered twice. A row
    // with no session_key (written before keys existed) is matched by date.
    let q = supabase
      .from("rsvps")
      .select("id")
      .eq("order_token", orderToken)
      .eq("session_date", s.date);
    if (s.key) q = q.or(`session_key.eq.${s.key},session_key.is.null`);
    const { data: existing, error: lookupErr } = await q.limit(1);

    if (lookupErr) {
      console.error("lookup failed", label, lookupErr);
      results[label] = "lookup-failed";
      continue;
    }
    if (existing?.length) { results[label] = "already-recorded"; continue; }

    // Through register(), so capacity is still checked under its row lock and
    // the rules live in exactly one place. p_key null (a legacy item id) makes
    // register() use the date, which it only does if one event is on it.
    const { data, error } = await supabase.rpc("register", {
      p_date: s.date,
      p_key: s.key,
      p_name: name || "(from order)",
      p_email: email,
      p_party: s.party,
      p_kit: s.kits > 0,
      p_kits: s.kits,
      p_meta: {
        tier: s.tier,
        amount: s.amount,
        kit_amount: s.kitAmount,
        order_token: orderToken,
      },
    });

    if (error) { console.error("register failed", label, error); results[label] = "error"; }
    else if (data?.ok) {
      console.log(`registered ${label} party=${s.party} kits=${s.kits} amount=${s.amount}`);
      results[label] = "registered";
    }
    else {
      // 'duplicate' means the browser beat us by less than ten minutes — fine.
      // 'ambiguous_session' means a legacy item id on a two-event date: the
      // money is in Snipcart, the registration needs entering by hand.
      console.warn("register refused", label, data);
      results[label] = data?.reason ?? "refused";
    }
  }

  // One line that says what this invocation actually did, per event. "registered"
  // means the backstop earned its keep; "already-recorded" means the browser
  // got there first and this correctly stood down.
  console.log(`order=${orderToken} email=${email} results=${JSON.stringify(results)}`);

  // Always 200 once the token validated: a non-2xx makes Snipcart retry, and
  // retrying won't fix a refusal like 'full'.
  return Response.json({ ok: true, order: orderToken, results });
});
