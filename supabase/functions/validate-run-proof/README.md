# validate-run-proof — AI photo validation (run proof, v2)

Validates the "run proof" photo a user uploads in **Manual Entry** and, in v2,
**reads the distance number from the photo and compares it to the km the user
typed** (tolerance ±0.5 km by default):
- ✅ **valid** — a **digital/smartwatch** screen or **health/running app screenshot** whose distance is readable AND within tolerance of the typed km
- ⚠️ **invalid** — selfie/face/random photo/non-fitness screenshot, OR the photo's distance is off by more than the tolerance
- ⏳ **needs_review** — looks like a real run proof but the number can't be read clearly (blurry/cropped) → held for review, **not** auto-rejected

The app calls `POST {SUPABASE_URL}/functions/v1/validate-run-proof` with
`{ image: "data:image/...;base64,...", km }` and expects
`{ valid, status, km_detected, delta, tolerance, reason }`.
If the function errors/is unreachable, the app **fails open** (accepts the photo
and flags it for manual review) so logging is never blocked.

**Limitations (be honest with users):** OCR on a photo of a screen can misread
blurry/glare/cropped numbers, unusual app layouts, or miles-vs-km. That is why
unreadable cases become `needs_review` rather than a hard reject, and why the
tolerance exists. Do not present this as 100% accurate.

## Tolerance

Default ±0.5 km. Override with a secret:

```bash
supabase secrets set VALIDATE_TOLERANCE_KM=0.5
```

## One-time setup

1. Install the Supabase CLI and log in:
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref cpvzwqptzcxnwzfzgrmt
   ```

2. Add your Anthropic API key as a secret (get one at console.anthropic.com):
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
   # optional: pick a different vision model
   # supabase secrets set ANTHROPIC_MODEL=claude-haiku-4-5-20251001
   ```

3. Deploy:
   ```bash
   supabase functions deploy validate-run-proof
   ```

That's it — the app will start auto-validating photos. Cost is tiny per photo
(uses the cheap Claude Haiku vision model by default).

> Prefer OpenAI instead of Anthropic? Tell me and I'll swap the function to the
> OpenAI vision API; the app side stays the same.
