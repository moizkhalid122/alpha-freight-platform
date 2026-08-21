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

const { fetchAdminProfilesRest, fetchAdminLoadsBundleRest } = await import("../src/lib/admin-rest.ts");

const t0 = Date.now();
try {
  const [profiles, loads] = await Promise.all([
    fetchAdminProfilesRest(),
    fetchAdminLoadsBundleRest(),
  ]);
  console.log(
    "OK",
    `${Date.now() - t0}ms`,
    "profiles:",
    profiles.length,
    "loads:",
    loads.loads.length
  );
} catch (error) {
  console.error("FAIL", Date.now() - t0, error instanceof Error ? error.message : error);
}
