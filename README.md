# Star Link

White-label link page. Version one is Romeo Has A Gun. Visits and link taps go to that artist’s Meta pixel (browser + Conversions API) so the audiences for ads are real.

Design and the one-day database swap: [docs/design.md](docs/design.md).

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Links live in `config/tenants.json`. Pixel credentials go in `.env.local` (copy `.env.example`). The page works before those are filled in — taps still redirect, events start once both `META_PIXEL_ID` and `CAPI_ACCESS_TOKEN` are set.

`TENANTS_JSON` replaces the config file when you want the whole catalog in env.
