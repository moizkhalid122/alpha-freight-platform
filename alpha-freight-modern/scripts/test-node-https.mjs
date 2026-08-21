import fs from "fs";
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

const { supabaseHttpsGet } = await import("../src/lib/supabase-node-http.ts");

for (let run = 1; run <= 2; run += 1) {
  const t0 = Date.now();
  const result = await supabaseHttpsGet(
    "profiles",
    "select=id,full_name,company_name,role,created_at&role=eq.supplier&order=created_at.desc"
  );
  console.log(
    `run${run}`,
    `${Date.now() - t0}ms`,
    result.error ?? "ok",
    Array.isArray(result.data) ? `${result.data.length} rows` : result.data
  );
}
