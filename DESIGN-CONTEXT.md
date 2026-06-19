# UOB Heartbeat Run × 20FIT — Design Context (for design sync)

**Live app:** https://uob-heartbeat-run.20fit.id
**Product:** Mobile-first running-challenge web app for UOB employees. Road to race day **29 Aug 2026**.
**Tech note for designers:** single-page web app, mobile-first; desktop adds a left sidebar. All values below are pulled from the live code — match them exactly so design ↔ build stays in sync.

---

## 1. Brand colours (CSS tokens — source of truth)

| Token | Hex / value | Use |
|---|---|---|
| `--blue` | `#0060C0` | Primary brand blue (links, active states, primary buttons) |
| `--blue-rich` | `#0A56AE` | Hero / deep blue surfaces, primary-button text on white |
| `--blue-deep` | `#00305F` | Darkest blue, login backdrop base |
| `--blue-bright` | `#2E8BE6` | Accent / highlights |
| `--red` | `#F4253C` | UOB Heartbeat red (heart, FAB, CTAs, pulse line) |
| `--ink` | `#0E2138` | Primary text |
| `--muted` | `#6A7C92` | Secondary text |
| `--bg` | `#F4F6FA` | App background (logged-in) |
| `--card` | `#FFFFFF` | Cards / sheets |
| `--line` | `rgba(14,33,56,0.09)` | Borders / dividers |

**Key-visual ribbon palette** (the tangled tubes in the brand artwork): coral `#EF9A82`→`#F7B78F`, pink `#EF9FB1`→`#F5BCC6`, lavender `#A99CD9`→`#C6B8E8`, soft blue `#7C98E6`→`#A6BCF2`, pink glow `#FDE3E6`.

## 2. Brand gradient (login backdrop / hero scrim)
- **Background base:** diagonal `#0A44A0` (top-left) → `#1A5BC0` → `#6F8AD8` → `#C7AACB` → `#F3B89A` (bottom-right), with a soft pink radial glow `#FDE3E6` on the right.
- **Legibility scrim over login art** (so white text reads):
  `linear-gradient(180deg, rgba(6,28,66,0.42) 0%, rgba(6,28,66,0.04) 26%, rgba(6,28,66,0.10) 52%, rgba(6,28,66,0.74) 82%, rgba(5,22,54,0.92) 100%)`

## 3. Typography — **New Hero** (UOB brand font)
- Family: **New Hero**, fallback `'Inter', sans-serif`. Applied to ALL text incl. numbers.
- Weights in use: **300** (Light), **400** (Regular — hero headline), **500/900** (Medium — UI/labels/numbers).
- Roles: `--font-hero` (welcome H1), `--font-display` (headings/buttons, weight 800), `--font-ui` (body/labels), `--font-num` (stats/numbers).

---

## 4. Canvas / artboard sizes

| Screen | Mobile artboard | Desktop artboard |
|---|---|---|
| Login / Welcome | **390 × 844** (design @1×) → export @3× **1170 × 2532** | **1440 × 900** |
| Home (logged-in) | **390 × 844** | **1440 × 900** |
| Content column (desktop) | — | centred, **max-width 620px**; left sidebar **264px** |

**Background artwork deliverable (the file you're uploading):**
- Mobile / portrait master: **1080 × 1920** (or 1170 × 2532).
- Desktop / landscape master: **2560 × 1440**.
- Composition: deep UOB blue dominant **top-left**, soft pink glow on the **right**, tangled ribbon tubes clustered along the **bottom** (so it crops cleanly behind the bottom-anchored hero copy on both orientations).
- Deliver **without** the white UOB top bar (logo + "Right By You") — that bar is drawn by the app, not baked into the image.

---

## 5. Login / Welcome screen spec (exact, from code)

- Full-bleed background image, `object-fit: cover`, `object-position: center`; backdrop base `--blue-deep`.
- Screen padding: `clamp(26px, 5vw, 52px)`.
- **Top logo lockup:** frosted white pill `rgba(255,255,255,0.92)`, radius **16**, padding `11×16`, blur 10. UOB Heartbeat logo height **26**, 1px divider, 20FIT logo height **15**.
- **Eyebrow:** "ROAD TO RACE DAY" — `--font-ui` weight 800, size **12**, letter-spacing **2**, colour `rgba(255,255,255,0.92)`, with a thin rule beside it.
- **H1:** "Ready to train for a better life" — `--font-hero` weight **400**, size `clamp(40px, 7.4vw, 70px)`, line-height **1.0**, white, text-shadow `0 2px 24px rgba(4,18,48,0.45)`.
- **Body:** `--font-ui`, size `clamp(15px, 1.8vw, 18px)`, line-height 1.55, `rgba(255,255,255,0.88)`, max-width 520.
- **Pulse line** (heartbeat EKG): red `--red`, ~460×32.
- **Primary CTA "Get Started":** white bg, text `--blue-rich`, radius **18**, padding `19px 0`, `--font-display` weight 800 size 18, shadow `0 18px 44px -14px rgba(2,14,40,0.55)`, max-width 480.
- **Secondary CTA "Log In":** translucent `rgba(255,255,255,0.12)`, 1.5px white border, radius 18, padding `17px 0`.
- **Footer:** "For UOB employees", `--font-ui` 12.5, `rgba(255,255,255,0.62)`, centred.

## 6. Shared component styling
- **Card radius:** 16–24px. **Button radius:** 14 (forms) / 18 (hero).
- **FAB (log run):** 58×58 circle, `--red`, 4px white border, floats over mobile tab bar.
- **Mobile tab bar:** fixed bottom, `rgba(255,255,255,0.92)` + blur 14, top border `--line`.
- **Desktop sidebar:** 264px, white, 1px right border; nav links radius 13, active = `rgba(0,96,192,0.1)` + `--blue`.
- **Shadows:** soft, blue-tinted, e.g. `0 10px 30px -12px rgba(4,20,52,0.5)`.

---

## 7. Where the background lives in the build (for sync)
- Single shared asset key **`loginBg`** (manifest uuid `12a62bdd-…`) powers BOTH the full-screen login background AND the home hero strip (`.hb-ribbon`). Update one → both update.
- Original was `image/png` 1420×414. New master should be portrait-friendly (see §4) so it crops well on mobile.
