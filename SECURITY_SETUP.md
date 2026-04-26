# Security Setup

## Replit Secrets
Add these as secrets, not in code:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GCP_PROJECT_ID`

## GCP VM secrets
Add the same values in Secret Manager or the VM environment. Never commit `.env` files.

## Required environment variables
Server-only:
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `JWT_SECRET`

Public:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Optional:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GCP_PROJECT_ID`
- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## Rotate compromised keys
1. Revoke the old key.
2. Generate a new one.
3. Update Replit Secrets and GCP Secret Manager.
4. Restart the app.

## Safe deployment
- Keep secrets out of git.
- Use server-only env vars on the backend.
- Never expose secret values to browser code.
- Validate env vars at startup before serving traffic.
