import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const { data, error } = await sb.auth.signInWithPassword({
  email: "alastair@alphafreightuk.com",
  password: "Alphaalastair22%",
});

if (error) {
  console.error("login:", error.message);
  process.exit(1);
}

const t0 = Date.now();
const res = await fetch("http://localhost:3000/api/commercial-director/profiles?role=supplier", {
  headers: { Authorization: `Bearer ${data.session.access_token}` },
  credentials: "include",
});
const body = await res.json();
console.log("ms:", Date.now() - t0, "status:", res.status, "count:", body.profiles?.length ?? 0);
if (body.error) console.log("error:", body.error);
