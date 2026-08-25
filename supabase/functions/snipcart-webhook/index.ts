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

/** "tix-2026-08-19-standard" -> { date, tier } */
function parseTix(id: string) {
  if (!id?.startsWith("tix-")) return null;
  const rest = id.slice(4);
  const cut = rest.lastIndexOf("-");
  if (cut < 0) return null;
  return { date: rest.slice(0, cut), tier: rest.slice(cut + 1) };
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
  if (body.eventName !== "order.completed") {
    return Response.json({ ok: true, ignored: body.eventName });
  }

  const order = body.content ?? {};
  const email = order.email ?? "";
  const name = order.billingAddressName ?? order.cardHolderName ?? "";
  const orderToken = order.token ?? order.invoiceNumber ?? null;
  const items = order.items ?? [];
  if (!email) return Response.json({ ok: false, reason: "no email on order" });

  // Roll the line items up per day.
  const byDate: Record<string, {
    party: number; amount: number; kits: number; kitAmount: number; tier: string;
  }> = {};
  const slot = (d: string) =>
    byDate[d] ??= { party: 0, amount: 0, kits: 0, kitAmount: 0, tier: "free" };

  for (const it of items) {
    const qty = it.quantity ?? 1;
    const unit = Number(it.unitPrice ?? it.price ?? 0) || 0;
    const tix = parseTix(it.id);
    if (tix) {
      const s = slot(tix.date);
      s.party += qty;
      s.amount += qty * unit;
      if (unit > 0 || s.tier === "free") s.tier = tix.tier;
    } else if (it.id?.startsWith("kit-")) {
      const s = slot(it.id.slice(4));
      s.kits += qty;
      s.kitAmount += qty * unit;
    }
  }

  const results: Record<string, string> = {};

  for (const [date, s] of Object.entries(byDate)) {
    if (s.party < 1) continue; // kits without a registration: nothing to record

    // Skip if the browser already recorded this order for this day. Without
    // this, a buyer who stayed on the page would be registered twice.
    const { data: existing, error: lookupErr } = await supabase
      .from("rsvps")
      .select("id")
      .eq("order_token", orderToken)
      .eq("session_date", date)
      .limit(1);

    if (lookupErr) {
      console.error("lookup failed", date, lookupErr);
      results[date] = "lookup-failed";
      continue;
    }
    if (existing?.length) { results[date] = "already-recorded"; continue; }

    // Through register(), so capacity is still checked under its row lock and
    // the rules live in exactly one place.
    const { data, error } = await supabase.rpc("register", {
      p_date: date,
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

    if (error) { console.error("register failed", date, error); results[date] = "error"; }
    else if (data?.ok) { results[date] = "registered"; }
    else {
      // 'duplicate' means the browser beat us by less than ten minutes — fine.
      console.warn("register refused", date, data);
      results[date] = data?.reason ?? "refused";
    }
  }

  // Always 200 once the token validated: a non-2xx makes Snipcart retry, and
  // retrying won't fix a refusal like 'full'.
  return Response.json({ ok: true, order: orderToken, results });
});
