import fs from "fs";
import https from "node:https";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const envPath = path.join(ROOT, ".env.local");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function httpsJson(method, urlString, headers, body) {
  const url = new URL(urlString);
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method,
        family: 4,
        timeout: 15000,
        headers: {
          ...headers,
          ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let text = "";
        res.on("data", (chunk) => {
          text += chunk;
        });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: text ? JSON.parse(text) : {} });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: text });
          }
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const login = await httpsJson(
  "POST",
  `${supabaseUrl}/auth/v1/token?grant_type=password`,
  {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  },
  {
    email: "alastair@alphafreightuk.com",
    password: "Alphaalastair22%",
  }
);

if (!login.body?.access_token) {
  console.error("login failed:", login.status, login.body);
  process.exit(1);
}

const t0 = Date.now();
const api = await httpsJson(
  "GET",
  "http://localhost:3000/api/commercial-director/profiles?role=supplier",
  {
    Authorization: `Bearer ${login.body.access_token}`,
    Accept: "application/json",
  }
);

console.log("ms:", Date.now() - t0, "status:", api.status, "count:", api.body?.profiles?.length ?? 0);
if (api.body?.error) console.log("error:", api.body.error);
