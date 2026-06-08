# validate-run-proof — AI photo validation (run proof)

Validates the "run proof" photo a user uploads in **Manual Entry**:
- ✅ a photo of a **digital/smartwatch** screen, or a **health/running app screenshot** that clearly shows a running **distance in km**
- ❌ selfies, faces, random photos, non-fitness screenshots → rejected with a reason

The app calls `POST {SUPABASE_URL}/functions/v1/validate-run-proof` with
`{ image: "data:image/...;base64,...", km }` and expects `{ valid, reason }`.
If the function errors/is unreachable, the app **fails open** (accepts the photo
and flags it for manual review) so logging is never blocked.

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
