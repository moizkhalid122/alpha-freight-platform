/**
 * One-time Commercial Director account setup.
 * Usage (PowerShell):
 *   $env:CD_EMAIL="alastair@alphafreightuk.com"
 *   $env:CD_PASSWORD="your-password"
 *   node scripts/setup-commercial-director-account.mjs
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(import.meta.dirname, "..");
const envPath = path.join(ROOT, ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
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

loadEnvFile(envPath);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.CD_EMAIL || "alastair@alphafreightuk.com").trim().toLowerCase();
const password = process.env.CD_PASSWORD || "";
const fullName = process.env.CD_FULL_NAME || "Alastair James Massey";

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!password || password.length < 8) {
  console.error("Set CD_PASSWORD (min 8 chars) before running this script.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(targetEmail) {
  let page = 1;
  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === targetEmail);
    if (match) return match;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

async function main() {
  const existing = await findUserByEmail(email);
  let userId;

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...existing.user_metadata,
        full_name: fullName,
        role: "commercial_director",
      },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Updated existing user: ${email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "commercial_director",
      },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created user: ${email}`);
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      role: "commercial_director",
      email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    console.warn(`Profile upsert warning: ${profileError.message}`);
  } else {
    console.log("Profile role set to commercial_director.");
  }

  console.log("Commercial Director account ready.");
  console.log(`Login: ${email}`);
  console.log("Panel: /comm-af-8k3m7/login");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
