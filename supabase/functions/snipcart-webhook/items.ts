// Snipcart line items -> one registration per EVENT.
//
// Kept apart from index.ts so it can be tested without Deno or Snipcart:
// it is plain TypeScript with no imports (node runs it with type stripping).
//
// Item ids, current and legacy — the legacy ones can still arrive from a cart
// that was filled before the switch, so both are understood:
//
//   tix-2026-11-06-farmtryout-standard   -> key 2026-11-06-farmtryout, tier standard
//   tix-2026-08-27-plant-id-supporter    -> key 2026-08-27-plant-id (slugs may hold "-")
//   tix-2026-08-19-standard   (legacy)   -> date only, key unknown
//   kit-2026-11-06-farmtryout            -> key 2026-11-06-farmtryout
//   kit-2026-08-19            (legacy)   -> date only
//
// The key is the session file's name, which is DATE-SLUG. Tier ids never
// contain "-", so the tier is whatever follows the last one.

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type Parsed = { date: string; key: string | null; tier?: string };

export function parseTix(id: string): Parsed | null {
  if (typeof id !== "string" || !id.startsWith("tix-")) return null;
  const rest = id.slice(4);
  const date = rest.slice(0, 10);
  if (!DATE.test(date) || rest[10] !== "-") return null;
  const after = rest.slice(11);                  // "farmtryout-standard" | "standard"
  const cut = after.lastIndexOf("-");
  const tier = cut < 0 ? after : after.slice(cut + 1);
  const slug = cut < 0 ? "" : after.slice(0, cut);
  if (!tier) return null;
  return { date, key: slug ? `${date}-${slug}` : null, tier };
}

export function parseKit(id: string): Parsed | null {
  if (typeof id !== "string" || !id.startsWith("kit-")) return null;
  const rest = id.slice(4);
  const date = rest.slice(0, 10);
  if (!DATE.test(date)) return null;
  if (rest.length === 10) return { date, key: null };
  if (rest[10] !== "-" || rest.length === 11) return null;
  return { date, key: rest };
}

export type Slot = {
  date: string;
  key: string | null;          // null: legacy id, register() falls back to the date
  party: number;
  amount: number;
  kits: number;
  kitAmount: number;
  tier: string;
};

type Item = { id?: string; quantity?: number; unitPrice?: number; price?: number };

/** Roll line items up per event. A legacy date-only line is folded into the
 *  keyed event on its date when there is exactly one — a kit added under the
 *  old id still belongs with the registration it was bought alongside. */
export function rollUp(items: Item[]): Slot[] {
  const slots = new Map<string, Slot>();
  const slot = (p: Parsed) => {
    const g = p.key ?? p.date;
    let s = slots.get(g);
    if (!s) {
      s = { date: p.date, key: p.key, party: 0, amount: 0, kits: 0, kitAmount: 0, tier: "free" };
      slots.set(g, s);
    }
    return s;
  };

  for (const it of items ?? []) {
    const qty = it.quantity ?? 1;
    const unit = Number(it.unitPrice ?? it.price ?? 0) || 0;
    const tix = parseTix(it.id ?? "");
    if (tix) {
      const s = slot(tix);
      s.party += qty;
      s.amount += qty * unit;
      if (unit > 0 || s.tier === "free") s.tier = tix.tier!;
      continue;
    }
    const kit = parseKit(it.id ?? "");
    if (kit) {
      const s = slot(kit);
      s.kits += qty;
      s.kitAmount += qty * unit;
    }
  }

  for (const [g, s] of [...slots]) {
    if (s.key) continue;
    const keyed = [...slots.values()].filter((t) => t.key && t.date === s.date);
    if (keyed.length !== 1) continue;
    const t = keyed[0];
    t.party += s.party;
    t.amount += s.amount;
    t.kits += s.kits;
    t.kitAmount += s.kitAmount;
    if (s.tier !== "free" && (t.tier === "free" || s.amount > 0)) t.tier = s.tier;
    slots.delete(g);
  }

  return [...slots.values()];
}
