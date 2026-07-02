# `staging/` — clean, testable version of the app (served at `/staging`)

## What this is

`staging/` is the **same app as production, un-packed into clean editable
files** — a place to test changes before they go live. It is served at:

```
https://<your-domain>/staging      (locally: http://localhost:3000/staging)
```

Production (the root `index.html`) is left untouched, so you can preview and
verify here first, then promote when you're happy.

## Why it exists

The root **`index.html` (≈4 MB)** is a *packed bundle*: the real app is hidden
inside a single JSON-escaped string plus 65 base64 assets. Editing it by hand
destroys formatting, which is why past fixes had to be fragile runtime hacks.
`staging/` is that same app generated back into normal files by
`tools/unbundle.mjs`:

```
staging/
  index.html                 clean, formatted (~1,130 lines) — no escaped blob
  assets/
    <uuid>.jsx / .js         the app source (edit these — formatting stays put)
                             + React / ReactDOM / Babel
    <uuid>.woff2             fonts (43)
    <uuid>.png / .webp       logos, key-visual artwork
    runtime-patches.js       the old wrapper's runtime tweaks, carried over
```

Verified in a headless browser to render **identically** to the live packed
app: same welcome screen, same sign-up form, no JS errors. The app scripts are
`type="text/babel"` and compiled in the browser by Babel Standalone — exactly
how the app worked before it was packed.

## How to work in it

Edit files in `staging/assets/*.jsx` (app logic/UI) or `staging/index.html`
(page shell, fonts, meta) — they're ordinary files, so formatting is preserved.
Run the server and open `/staging`:

```
npm start           # node server.js  → http://localhost:3000/staging
```

## Going live (opt-in — not done automatically)

When staging looks good and you want it to become production, either:

1. Move `staging/`'s contents to the repo root (replacing the packed
   `index.html` + adding `assets/`), or
2. Point the deploy at `staging/` as the web root.

Ask and I'll do the promotion + adjust `server.js` accordingly.

## Regenerating

If the root `index.html` is updated again from the design tool, rebuild with:

```
node tools/unbundle.mjs
```

This rebuilds `staging/` and re-applies `tools/runtime-patches.js`.
