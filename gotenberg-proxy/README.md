# Gotenberg Proxy for Render

This is a Caddy reverse proxy that adds bearer token authentication to a Gotenberg instance deployed on Render.

## Deployment Instructions

1. Create a new GitHub repo with these files
2. In Render dashboard → New → Web Service → connect this repo
3. Name: `gotenberg-proxy`
4. Instance type: Free
5. Environment variables:
   - `GOTENBERG_AUTH_TOKEN` = your generated secret (same as in main app)
   - `GOTENBERG_INTERNAL_URL` = `gotenberg:3000` (or Render's internal DNS format)
6. Deploy

The public URL assigned by Render (e.g., `https://gotenberg-proxy-xxxx.onrender.com`) is what you'll use as `GOTENBERG_URL` in the main app.
