# Workshop Registration with Snipcart

## How It Works

Each workshop page (e.g. `src/workshops/mesh-radio/mesh-radio.md`) can have a `workshopDates` array in its front matter. When dates are listed, the page displays registration sections (top and bottom) with a date selector, price, and a Register button that adds the item to a Snipcart cart. When `workshopDates` is empty or missing, the registration sections are hidden automatically.

Snipcart handles the cart, checkout, and payment processing. Each date is a separate Snipcart product identified by its `id`, so inventory is tracked per date.

## Front Matter Setup

Add a `workshopDates` array to the workshop's front matter. Each entry needs:

```yaml
workshopDates:
  - id: "mesh-radio-2026-04-12-1400"
    date: "Saturday, April 12, 2026"
    time: "2 PM"
    location: "Greater Boston (in-person)"
    maxTickets: 10
  - id: "mesh-radio-2026-05-10-1200"
    date: "Saturday, May 10, 2026"
    time: "12 PM"
    location: "Online (virtual)"
    maxTickets: 30
```

### Field descriptions

| Field | Purpose |
|-------|---------|
| `id` | Unique product ID for Snipcart. Must match the product ID in the Snipcart dashboard. Convention: `workshop-name-YYYY-MM-DD-HHMM` |
| `date` | Human-readable date shown on the page and in the cart |
| `time` | Human-readable time shown on the page and in the cart |
| `location` | Location shown on the page and in the cart description |
| `maxTickets` | Used by the availability worker to show remaining spots (before Snipcart has inventory data) |

### What gets built from these fields

- **Page label** (radio button): `{date} at {time} — {location}`
- **Cart item name**: `Mesh Radio Workshop Ticket — {date} at {time}`
- **Cart description**: `Mesh Radio Ticket - {date} at {time} — {location}`

You only type the date, time, and location once — they're reused everywhere.

### To hide registration

Set `workshopDates` to empty:

```yaml
workshopDates:
```

Or remove it from the front matter entirely. Both registration sections and the JavaScript will be hidden.

## Snipcart Dashboard Setup

For each date in `workshopDates`:

1. Go to Snipcart dashboard (make sure you're in the right mode — Test or Live)
2. Products won't appear until someone has added them to a cart at least once. So load the page and click Register to trigger product creation.
3. Go to **Products**, find the product by its `id` (e.g. `mesh-radio-2026-04-12-1400`)
4. Enter a number in **"Stock on hand"** and save
5. Snipcart will automatically decrement stock with each purchase

## Snipcart Configuration

### API Key

The Snipcart public API key is in `src/_data/site.json`:

```json
"snipcartApiKey": "your-public-key-here"
```

- **Test mode** and **Live mode** have different API keys
- Switch the key in `site.json` when going live, then rebuild and deploy

### Domain Settings

In the Snipcart dashboard under **Settings > Domains & URLs**, make sure your site domain (e.g. `waterbearfieldschool.org`) is listed. Snipcart crawls your page to validate products — orders will fail if the domain isn't registered.

### Snipcart Loading

Snipcart is only loaded on pages with `snipcart: true` in the front matter. The loading script is in `src/_includes/layouts/base.njk`.

## Payment Gateway (Stripe)

Snipcart uses Stripe for payment processing. Setup:

1. Create a Stripe account and connect it in the Snipcart dashboard
2. Stripe reviews new accounts (takes 2-3 days)
3. Test with card number `4242 4242 4242 4242`, any future expiry, any CVC

### Fees

- **Stripe**: 2.9% + $0.30 per transaction
- **Snipcart**: 2% per transaction ($10/month minimum when live)

## Availability Worker (Optional)

An optional Cloudflare Worker (`availability-worker/`) can query Snipcart's API to show real-time availability badges on the page ("7 spots left", "Sold out", etc.).

### Setup

1. `cd availability-worker`
2. `npm install wrangler` (if not already installed)
3. `npx wrangler secret put SNIPCART_SECRET_KEY` — enter your Snipcart secret API key
4. `npx wrangler deploy`
5. Copy the deployed worker URL into `src/_data/site.json`:

```json
"availabilityWorkerUrl": "https://wfs-availability.your-subdomain.workers.dev"
```

If `availabilityWorkerUrl` is not set or is `YOUR_WORKER_URL_HERE`, the availability badges simply won't appear — registration still works fine without it.

## Adding Registration to Other Workshops

To add Snipcart registration to another workshop page:

1. Add `snipcart: true` to the front matter
2. Add the `workshopDates` array with your dates
3. Copy the `<style>`, hero HTML sections, and `<script>` block from the mesh-radio page
4. Update the cart name/description strings in the HTML and JS to match the new workshop name
5. Create matching products in the Snipcart dashboard
