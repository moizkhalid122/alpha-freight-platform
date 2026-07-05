# Oracle Cloud — Alpha Freight AI (Ollama + Backend) — FREE

Roman Urdu guide. Ollama + hamara AI backend **$0** pe 24/7.

---

## Kya milega

```
Oracle Free VM
├── Ollama (llama3.1)
├── Alpha Freight backend (port 3003)
├── Tavily web search
└── Supabase login auth
```

Mobile app URL: `http://YOUR_VM_IP:3003` (baad mein HTTPS optional)

---

## PART 1 — Oracle account + VM (tum browser pe)

### Step 1 — Account
1. Jao: https://www.oracle.com/cloud/free/
2. **Start for free** → sign up (card verify ho sakta hai, charge nahi hota free tier pe)
3. Home region choose karo (e.g. **UK London** ya **Germany Frankfurt**)

### Step 2 — VM create karo
1. Menu → **Compute** → **Instances** → **Create instance**
2. Name: `alpha-freight-ai`
3. **Image:** Ubuntu 22.04 (aarch64 / ARM)
4. **Shape:** Click **Change shape**
   - **Ampere** → **VM.Standard.A1.Flex**
   - OCPUs: **2** (ya 4 agar quota ho)
   - Memory: **12 GB** (ya 24 GB)
   - ✅ Always Free-eligible dikhna chahiye
5. **Networking:** Public IPv4 assign ✅
6. **SSH keys:** **Generate a key pair** → **Save private key** (`.key` file — kho mat dena!)
7. **Create instance**

### Step 3 — Firewall (bahut important!)
1. Instance page pe **Subnet** link click karo
2. **Security List** → **Default Security List**
3. **Add Ingress Rules:**

| Source | Protocol | Port |
|--------|----------|------|
| `0.0.0.0/0` | TCP | `22` (SSH — usually already) |
| `0.0.0.0/0` | TCP | `3003` (AI backend) |

4. Save

### Step 4 — Public IP note karo
Instance page pe **Public IP address** copy karo — e.g. `123.45.67.89`

---

## PART 2 — VM pe setup (SSH)

### Windows se connect

PowerShell (private key jahan save ki):

```powershell
ssh -i "C:\path\to\your-key.key" ubuntu@YOUR_PUBLIC_IP
```

Pehli dafa "yes" type karo.

### Repo clone + deploy

VM pe yeh commands:

```bash
sudo apt-get update
sudo apt-get install -y git

git clone https://github.com/moizkhalid122/alpha-freight-platform.git
cd alpha-freight-platform/alpha-freight-modern/deploy/oracle

cp .env.example .env
nano .env
```

**`.env` mein yeh bharno:**

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
TAVILY_API_KEY=tvly-...
AI_REQUIRE_AUTH=true
```

Save: `Ctrl+O`, Enter, `Ctrl+X`

Phir setup script:

```bash
chmod +x setup-vm.sh update.sh
sudo bash setup-vm.sh
```

⏳ Pehli dafa **10–20 min** lag sakte hain (Docker + llama3.1 download).

### Test

Browser ya phone se:

```
http://YOUR_PUBLIC_IP:3003/api/health
```

`"status":"ok"` aana chahiye.

---

## PART 3 — Mobile app URL

Jab health OK ho:

1. `alpha-freight-mobile/.env` (local test):
   ```
   EXPO_PUBLIC_AI_API_URL=http://YOUR_PUBLIC_IP:3003
   ```
2. Production `eas.json` mein bhi wahi URL (http works dev; store ke liye baad mein HTTPS)

App reload → AI assistant test karo (login zaroori hoga — `AI_REQUIRE_AUTH=true`).

---

## Updates (code change ke baad)

VM pe:

```bash
cd ~/alpha-freight-platform/alpha-freight-modern/deploy/oracle
bash update.sh
```

---

## HTTPS (optional, free — baad mein)

Domain ho to **Cloudflare Tunnel** use karo — free SSL, no $7 Render.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| SSH nahi ho raha | Ingress rule port 22, correct `.key` file |
| Health timeout | Ingress rule port **3003**, `docker compose ps` check |
| Ollama slow / fail | `docker exec alpha-ollama ollama pull llama3.1` |
| 401 on chat | App mein login karo (Supabase session) |
| Out of memory | VM shape 2 OCPU / 12GB se 4/24 try karo |

---

## Useful commands

```bash
cd ~/alpha-freight-platform/alpha-freight-modern/deploy/oracle
docker compose ps
docker compose logs -f backend
docker compose logs -f ollama
docker compose restart
```

---

## Cost

Oracle **Always Free** tier = **$0/month** (quota ke andar).

Card verify hota hai lekin free resources pe charge nahi aata jab tak paid resources na lo.
