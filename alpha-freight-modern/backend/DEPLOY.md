# Phase 5 — AI Backend Production Deploy

Deploy `alpha-freight-modern/backend` to Render, Railway, or Docker.

## Requirements

- **Always-on** host (not serverless) — Ollama + embeddings need a running process
- **Ollama** on same VM or reachable URL (`OLLAMA_URL`)
- **Supabase** prod URL + anon key (for JWT auth)
- **Tavily** API key (web search)

---

## Option A — Render (recommended)

1. Push repo to GitHub
2. Render → **New Blueprint** → select `alpha-freight-modern/render.yaml`
   - Or manual Web Service:
     - **Root Directory:** `alpha-freight-modern`
     - **Build:** `cd backend && npm install`
     - **Start:** `cd backend && npm start`
3. Set secrets in Render dashboard:

```
OLLAMA_URL=https://your-ollama-host:11434
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
TAVILY_API_KEY=tvly-...
AI_REQUIRE_AUTH=true
CORS_ORIGINS=https://www.alphafreightuk.com
```

4. Health check: `GET https://YOUR-SERVICE.onrender.com/api/health`
5. Chat test (with Supabase JWT):

```bash
curl -X POST https://YOUR-SERVICE.onrender.com/api/chat \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","assistantType":"carrier"}'
```

---

## Option B — Docker

From repo root:

```bash
cd alpha-freight-modern
docker build -t alpha-freight-ai .
docker run -p 3003:3003 \
  -e AI_REQUIRE_AUTH=true \
  -e SUPABASE_URL=... \
  -e SUPABASE_ANON_KEY=... \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  -e TAVILY_API_KEY=... \
  alpha-freight-ai
```

---

## Mobile app (EAS production)

1. Update `eas.json` production `EXPO_PUBLIC_AI_API_URL` to your HTTPS backend URL
   - Or use EAS secrets: `eas env:create --environment production`
2. Build:

```bash
cd alpha-freight-mobile
eas build --profile production --platform android
```

3. App sends `Authorization: Bearer <supabase_session>` automatically.

---

## Local dev (auth off)

In `backend/.env`:

```
AI_REQUIRE_AUTH=false
```

Restart backend — mobile works without login gate on LAN.

---

## Security checklist

- [ ] `AI_REQUIRE_AUTH=true` in production
- [ ] HTTPS only for `EXPO_PUBLIC_AI_API_URL`
- [ ] Rate limit enabled (`AI_RATE_LIMIT=40`)
- [ ] CORS origins set for web app
- [ ] Health endpoint does not expose internal URLs in production
