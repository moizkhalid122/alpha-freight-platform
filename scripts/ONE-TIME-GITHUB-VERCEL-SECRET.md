# One-time: enable automatic live deploy

GitHub Actions deploys to Vercel when `VERCEL_TOKEN` exists on the repo.

1. Open https://vercel.com/account/tokens → **Create Token** (full account scope).
2. Open https://github.com/moizkhalid122/alpha-freight-platform/settings/secrets/actions
3. **New repository secret** → Name: `VERCEL_TOKEN` → paste token → Save.
4. Open https://github.com/moizkhalid122/alpha-freight-platform/actions/workflows/vercel-production.yml → **Run workflow**.

After that, every push to `master` deploys production with `PLATFORM_PUBLIC_MODE=warning_only`.