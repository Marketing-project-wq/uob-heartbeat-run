# Working agreement — UOB Heartbeat Run

> **Ringkasan (ID):** Setiap perubahan **dikerjakan di `staging/` dulu** dan
> dites di `/staging`. **Produksi (root `index.html`) TIDAK disentuh** sampai
> user bilang **"deploy"**. Saat deploy, produksi **di-REPLACE** dengan isi
> `staging/` (bukan di-merge). Jangan tinggalkan file duplikat.

These are standing instructions. Follow them on **every** task and **every**
session unless the user overrides them in that session.

## The app in one paragraph

Mobile-first web app for UOB employees (road to race day 29 Aug 2026). The
**live site is the repo-root `index.html`** — a ~4 MB *packed bundle* (the real
app is hidden inside a JSON-escaped string + base64 assets). Editing that packed
file by hand destroys formatting, so **do not edit it directly**. The clean,
editable copy of the same app lives in **`staging/`** and is served at
**`/staging`** by `server.js`.

## Golden workflow — staging first, deploy only on command

1. **All new work goes into `staging/` first.** Edit `staging/index.html` or
   `staging/assets/*.jsx` — these are clean, formatted, normal files. Never make
   feature/content edits in the root `index.html`.
2. **Test before reporting done.** Run `npm start` and open
   `http://localhost:3000/staging` (or browser-test) and confirm the change
   works — no white screen, no JS errors.
3. **Never deploy automatically.** Production stays untouched until the user
   explicitly says one of: **"deploy" / "go live" / "publish" / "jadikan live"
   / "naikkan ke produksi"**. Reporting a staging change as done is NOT deploy.
4. **On the deploy command:** promote `staging/` → production by **replacing**
   the production files (copy `staging/index.html` + `staging/assets/` to the
   web root, overwriting the old packed `index.html`), then commit + push.

## Replace, don't merge (why the code got messy before)

- Apply every change as a **clean replacement** — rewrite the whole file with the
  new version. **Do not merge, append, or layer patches** on top of old content.
- **No duplicate/backup files** (e.g. `index (1).html`). One clean file per job.
- Prefer fixing things **in the source** (`staging/assets/*.jsx`) over runtime
  DOM hacks. Runtime tweaks live only in `staging/assets/runtime-patches.js`.
- When promoting staging → production, the staging version **replaces**
  production wholesale.

## Guardrails

- Work only on the branch the task assigns (e.g. `claude/...`). Never push to
  `main`/production without explicit permission.
- **Do NOT open a Pull Request** unless the user explicitly asks.
- **Never commit secrets** — API tokens, JWTs, passwords, or API-documentation
  files that contain credentials. If the user shares such a file, keep it out of
  the repo and warn them to rotate the exposed credentials.
- If an interactive tool (e.g. the multiple-choice question tool) errors out,
  don't get stuck — ask the question in plain text and keep going.

## Repo map

- `index.html` — **production** (packed bundle; don't hand-edit).
- `staging/` — clean editable app, served at `/staging`. **Edit here.**
  - `staging/assets/*.jsx` — app source.  `staging/assets/runtime-patches.js` —
    carried-over runtime tweaks.
- `server.js` — serves `/` (prod), `/staging`, `/virtualrun`, `/virtualrun-test`.
- `tools/unbundle.mjs` — regenerate `staging/` from a new packed `index.html`
  (`node tools/unbundle.mjs`). Re-applies `tools/runtime-patches.js`.

## Regenerating staging from a new packed bundle

If the user provides a new packed `index.html` from their design tool, rebuild
the clean copy with `node tools/unbundle.mjs`, then continue editing in
`staging/`.
