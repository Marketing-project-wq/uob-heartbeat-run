# `src/` — clean, editable version of the app (the "un-bundled" mirror)

## Why this exists

The root **`index.html` (≈4 MB)** is not normal code — it's a *packed bundle*.
The real app is hidden inside a single JSON-escaped string (every `/` written
as `\/`, all on one giant line) plus 65 base64-encoded assets. Editing it by
hand is nearly impossible, which is why:

- small edits keep **destroying the formatting**, and
- past fixes had to be done as fragile **runtime patches** (injected `<style>`,
  a `MutationObserver` renaming labels) instead of editing the real source.

On top of that, merges left duplicate copies (`index (1).html`, `index (3).html`)
lying around, adding to the mess.

## What this folder is

`src/` is the **same app, un-packed into editable files** — generated from the
root `index.html` by `tools/unbundle.mjs`:

```
src/
  index.html                 clean, formatted (~1,130 lines) — no escaped blob
  assets/
    <uuid>.jsx               the app source (edit these — formatting stays put)
    <uuid>.js                React / ReactDOM / Babel and other libraries
    <uuid>.woff2             fonts (43)
    <uuid>.png / .webp       logos, key-visual artwork
    runtime-patches.js       the old wrapper's runtime tweaks, carried over
```

It has been **verified in a headless browser to render identically** to the
live packed app: same welcome screen, same sign-up form, no JS errors.

> Note: the app scripts are `type="text/babel"` and are compiled in the browser
> by Babel Standalone — exactly how the app worked before it was packed.

## How to work in it

Edit the files in `src/assets/*.jsx` (app logic/UI) or `src/index.html`
(page shell, fonts, meta). Formatting is preserved because these are ordinary
files. To preview locally, serve the folder with any static server, e.g.:

```
npx serve src        # or: python3 -m http.server -d src 8080
```

## Going live (not done yet — needs your OK)

The live site still serves the root `index.html`. When you're ready to switch
to this clean version, it takes two small changes (ask and I'll do them):

1. Make `src/` the served root (or move its contents to the repo root),
   replacing the packed `index.html`.
2. Update `server.js` to serve `src/` and its `/assets/*` (GitHub Pages serves
   static files automatically; the Node server needs one small addition).

Until then, nothing about the live app changes.

## Regenerating

If the root `index.html` is ever updated again from the design tool, re-run:

```
node tools/unbundle.mjs
```

This rebuilds `src/` and re-applies `tools/runtime-patches.js`.
