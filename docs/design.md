# Star Link — design

White-label link page for artists. Version one is Romeo Has A Gun. A fan opens the page, taps Spotify, Apple Music, YouTube, Instagram, or TikTok, and that visit and that tap are sent to **that artist’s** Meta pixel from the browser and from the server, with the same `event_id`.

Meta is the audience store. Lookalikes are built in Events Manager. This app is the pipe.

There is no Starflo pixel, no Starflo name on the page, and no second event fired “for the platform.” Market Mate dual-fires a Storage pixel so Starflo’s own ads can see tenant purchases. That pattern does not belong on a friend’s site.

## What shipped in the MVP

- One Next.js app. No database, no login, no admin.
- Tenant config in `config/tenants.json`. `TENANTS_JSON` replaces that file when set.
- Pixel id, Conversions API token, and test event code come from env when the JSON leaves them blank. See `.env.example`.
- Public page: name, tagline, link list, optional email row.
- `GET /out/[linkId]` redirects to the real URL with UTMs. Destination URLs are never taken from the query string.
- After consent: Meta pixel `PageView` and `ViewContent` via `trackSingle`, plus Conversions API with the same `event_id`.
- `fbclid` on the landing URL is written to an `_fbc` cookie before the pixel loads.
- Email row stores a line in `data/leads.jsonl` (gitignored). Hashed `Lead` goes to Meta only if measurement was accepted.
- The page works with the pixel env vars empty. Links still redirect. Events start when the token and pixel id are set.

## Events

A streaming tap is `ViewContent`. It is not a `Purchase`. A fake purchase value teaches the pixel the wrong goal.

| Moment | Event | `content_category` | Where |
|---|---|---|---|
| Page load, after consent | `PageView` | — | Pixel + `POST /api/e` |
| Link tap, after consent | `ViewContent` | `spotify`, `apple_music`, `youtube`, `instagram`, `tiktok` | Pixel, then `GET /out/:id?eid=&track=1` |
| Email submit, after consent | `Lead` | `mailing_list` | Pixel + `POST /api/lead` |

`ViewContent` custom data:

- `content_ids`: link id (`spotify`)
- `content_name`: button label
- `content_type`: `music_link`
- `content_category`: platform

In Events Manager, a Custom Conversion on `ViewContent` where `content_category = spotify` is the lookalike seed for that platform. Same for the others, and one more with no category filter for “anyone who tapped a link.”

Lookalikes get useful closer to a thousand people. A bio link may not get there quickly. The email row is the smaller, higher-quality seed: hashed `Lead`, and later a customer-list upload of those same hashes. The email row sits under the links. It does not gate them.

## Request flow

```
Fan → GET /
  consent accepted
  → pixel PageView event_id=A
  → POST /api/e PageView event_id=A
     (ip, user agent, _fbp, _fbc, event_source_url)

Fan → tap Spotify
  → pixel ViewContent event_id=B
  → GET /out/spotify?eid=B&track=1
  → Conversions API ViewContent event_id=B
  → 302 to Spotify with utm_source={slug}&utm_medium=bio&utm_campaign=spotify
```

If JavaScript never runs, `/out/spotify` still redirects and does not call Meta. If they decline measurement, the same thing happens: the link works, no pixel, no Conversions API.

Shared `event_id` is how Meta collapses the browser event and the server event within 48 hours. `event_source_url` is always set. Market Mate got flagged for omitting it, and delivery optimization degrades when it is missing.

Every server event also sends `action_source: website`, `client_ip_address`, `client_user_agent`, and `fbp` / `fbc` when the cookies exist. Email is trimmed, lowercased, and SHA-256 hashed. Raw email is not put in the Meta payload or in server logs.

`_fbp` is often missing on the first `PageView` and present by the tap. The tap is the event that matters. `_fbc` is synthesized as `fb.1.{timestampMs}.{fbclid}` when the landing URL has `fbclid` and the cookie is not set yet, so an ad click matches on the first hit.

`test_event_code` is sent with the Graph payload when `META_TEST_EVENT_CODE` is set. Unset it in production.

Graph API version is pinned to `v21.0` in `lib/meta-capi.ts`, the same version Market Mate uses.

## Config

`getRequestTenant()` is the only read API. Routes do not open the JSON file themselves.

Resolution:

1. If `TENANTS_JSON` is set, parse that. Otherwise read `config/tenants.json`.
2. Zod-parse the array. A bad blob throws at request time so a broken config cannot render a half page.
3. Fill empty `meta.pixelId`, `meta.capiAccessToken`, and `meta.testEventCode` from env. With one tenant, `META_PIXEL_ID`, `CAPI_ACCESS_TOKEN`, and `META_TEST_EVENT_CODE` apply. With several tenants, use per-tenant values inside the JSON, or `CAPI_TOKENS` as `{"slug":"token"}`. A single global pixel env var is not copied onto every tenant, because that would mix audiences.
4. Match `Host` (or `x-forwarded-host`) against `hosts`, ignoring the port. One tenant and an unknown host still resolves to that tenant, so the first production domain works before `hosts` is updated. Two tenants and an unknown host is a 404.

The browser receives a public tenant: name, theme, links as `{ id, label, platform }`, pixel id. The access token stays on the server.

Version-one tenant is `romeo-has-a-gun`:

- Spotify — `https://open.spotify.com/artist/229hIWTYgfF2OQxd7UqifF`
- Apple Music — `https://music.apple.com/ca/artist/romeo-has-a-gun/1672695771` (the Canada storefront URL; Apple still routes the listener by their own storefront)
- YouTube — `https://www.youtube.com/@romeo_has_a_gun`
- SoundCloud — `https://soundcloud.com/romeohasagun`
- Instagram — `https://www.instagram.com/romeohasagun_`
- TikTok — `https://www.tiktok.com/@romeohasagun_`

The page follows the Market Mate members layout: Archivo, a light `neutral-50` ground, a white top bar, then white `rounded-2xl` cards. `bannerUrl` is an optional YouTube link rendered as a muted, looping banner. There is no logo mark. Link rows carry the service mark (Spotify, Apple Music, YouTube, Instagram, TikTok). Theme colors stay on the tenant for a later repaint. The type is shared until a tenant needs its own font.

Outbound UTMs use the tenant slug as `utm_source`, so a friend’s Spotify for Artists does not say “starlink.”

## White label

- No platform mark in the UI, the Open Graph tags, or the network calls.
- `trackSingle` targets the tenant pixel only. The pixel snippet never calls `fbq('track', ...)`, which would hit every initialized pixel.
- Unknown link ids 404. The redirect target is the URL stored on that link.
- Adding a friend is another object in the config, their pixel and token, and their domain on the Vercel project. Redeploy. That redeploy is the admin panel until the database day.

Consent copy does not name this app. It says measurement goes to Meta so the artist can see which links get opened. Default is off until they accept. The choice is `localStorage` key `sl-consent`.

## Code map

| Path | Role |
|---|---|
| `config/tenants.json` | Default catalog. Romeo Has A Gun. |
| `lib/tenant-schema.ts` | Zod contract, host match, public tenant shape. Safe for the browser. |
| `lib/tenants.ts` | Read the file or `TENANTS_JSON`, apply secrets, `getRequestTenant()`. The storage seam. |
| `lib/meta-capi.ts` | Graph `POST /{pixelId}/events`. |
| `lib/fbq.ts` | Browser `trackSingle` + pixel install. |
| `lib/request-meta.ts` | IP, user agent, `_fbp`, `_fbc`, `event_source_url`. |
| `proxy.ts` | `fbclid` → `_fbc` cookie. |
| `app/page.tsx` | Link page. |
| `app/out/[linkId]/route.ts` | Conversions API `ViewContent`, then 302. |
| `app/api/e/route.ts` | Conversions API `PageView`. |
| `app/api/lead/route.ts` | Append `data/leads.jsonl`, Conversions API `Lead` if consented via the client only sending when accepted. |
| `components/band-page.tsx` | Poster, taps, consent, email row. |

Stolen from the existing stack, slimmed:

- `market-mate/lib/meta-capi.ts` — hash, payload, fire-and-forget log, never throw into the redirect.
- `stella-starfetch/lib/meta-attribution.ts` — read `_fbp` and `_fbc`. Here the redirect is same-origin, so the server reads those cookies off `/out` instead of stashing them in Stripe metadata.

## One day: database config

Do this when a redeploy to change a link is annoying, a second friend wants to edit their own page, or emails have to survive on Vercel. `data/leads.jsonl` is local disk. Vercel’s filesystem will not keep it.

Budget: one day, because routes already call `getRequestTenant()` and nothing else.

### Store

A database that belongs to this app. Not Market Mate’s Cockroach cluster. SQLite is enough for a single box. Postgres (Neon, or Vercel’s marketplace Postgres) is the right call if it is deployed on Vercel. Prisma is fine. No `prisma db push` against any Starflo production cluster.

### Tables

```
Tenant
  id            cuid
  slug          unique
  name
  tagline
  avatarUrl
  bannerUrl     optional YouTube URL, muted looping banner
  theme         json   { bg, fg, accent }
  hosts         string[]
  privacyUrl    optional
  pixelId
  capiAccessToken
  testEventCode
  leadEnabled   bool
  leadHeading
  leadButton

Link
  id            cuid
  tenantId
  key           the public id used in /out/:key  ("spotify")
  label
  url
  platform
  sort          int
  unique (tenantId, key)

Lead
  id            cuid
  tenantId
  email
  eventId
  createdAt
  unique (tenantId, email)   so the list is a list, not a log of retries
```

The Zod schema in `lib/tenants.ts` stays the contract. A row is mapped into the same `Tenant` object the JSON loader returns. `toPublicTenant()` still strips the token before it reaches the client.

### The day, in order

1. Add Prisma and the three models. Point `DATABASE_URL` at the new database only.
2. `scripts/seed-tenants.ts` reads `config/tenants.json` plus env secrets and upserts on `slug` and link `key`. Run it once. Confirm with a read of those three tables, then stop.
3. Replace the body of `loadTenants()` / `getRequestTenant()` with a query by host. Keep `resolveTenant()` for the “one tenant, unknown host” rule, or push that rule into SQL (`hosts` contains host, else if count = 1 return it).
4. `POST /api/lead` inserts into `Lead` instead of appending a file. Still hash before Conversions API. Still skip Conversions API when the client did not accept measurement (the route can take `track: true` the same way `/out` does).
5. Delete the JSON-file read. Keep `TENANTS_JSON` out of production once the database is live so there are not two sources.
6. Hit `/`, tap a link, submit an email, and confirm Events Manager (test event code) plus one `Lead` row.

Routes, pixel, redirect, and consent do not change on this day. An admin UI is the day after, and it is a form over these tables, not a new product.

### What the database day is not

- A CRM with pipelines, notes, and deal stages. The list of emails plus Meta audiences is the CRM until someone asks for more.
- A Starflo-platform pixel column.
- A migration onto Market Mate’s company table. Different product, different blast radius.

## Later, only if someone asks

- Admin UI to edit links without a redeploy. The tables above are already the form.
- Customer-list upload of hashed emails to Meta, for when the pixel seed is still small.
- Custom domains are a Vercel domain plus a `hosts` entry. No extra routing code while unknown-host falls through for a single tenant. Once two tenants exist, each domain must be listed.
- A second ad platform behind `lib/fbq.ts` and `lib/meta-capi.ts`. The page should keep calling those, not Meta’s globals directly. It already does.
- Merch. The first real `Purchase` uses a real value and the same `event_id` dedupe as Market Mate tickets. Not before money changes hands.

## Explicitly out

Database on day one, Clerk, a dashboard, drag-and-drop ordering, a single “Listen” button that hides the platform, a platform pixel, `Purchase` on a click.

## Meta setup (when the pixel exists)

In the band’s Meta Business Manager: create a pixel, Events Manager → Settings → Generate access token, and copy a test event code. Put them in `.env.local`:

```
META_PIXEL_ID=
CAPI_ACCESS_TOKEN=
META_TEST_EVENT_CODE=
```

Restart the dev server. Accept measurement on the page. Events Manager’s test view should show `PageView`, then `ViewContent` with `content_category` matching the link. Clear `META_TEST_EVENT_CODE` before production traffic.
