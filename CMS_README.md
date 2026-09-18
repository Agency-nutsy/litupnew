# CMS Operator Guide

This document is for the **site operator** (you, the developer/agency).
Clients who have purchased a finalized site do not need to see this file.

---

## Quick Start

1. Copy `.env.example` to `.env.local` and set a strong `CMS_ADMIN_PASSWORD`.
2. Start the dev server: `npm run dev`
3. Open `http://localhost:8081/dashboard-x7k2` (or whatever port Vite picks).
4. Enter the password from your `.env.local`.
5. Edit any field, click **Save changes** — the live site reflects changes immediately on next page load. No rebuild required.

---

## Data storage

| What | Where |
|------|-------|
| Runtime content (edits made via CMS form) | `data/restaurant.json` |
| Uploaded photos | `public/uploads/` |
| Seed / default content | `src/lib/restaurant-data.ts` |

`data/restaurant.json` is **git-ignored** by default — add it to your backup routine.
`public/uploads/` should also be backed up (or migrated to an object store for production).

### Resetting to defaults
Delete `data/restaurant.json`. On next page load the site reverts to the seed data in
`src/lib/restaurant-data.ts` (`defaultRestaurantData`).

### Migrating a sold site's data
1. `scp server:/path/to/project/data/restaurant.json ./backup-clientname.json`
2. `scp -r server:/path/to/project/public/uploads/ ./backup-uploads-clientname/`

---

## Selling a site ("sell and lock")

1. Finalize all content via the CMS form.
2. Go to the **Lock / Security** tab in the CMS.
3. Toggle **Lock this site** ON and save.
4. The `/dashboard-x7k2` route now returns 404 to everyone — even with the correct password.

### Unlocking after selling (to make a correction)

**Option A — Edit the JSON directly (quickest)**
```bash
# On the server where the site is running:
nano data/restaurant.json
# Find "isLocked": true  →  change to  "isLocked": false
# Save, no restart needed — next request reads the file.
```

**Option B — Delete the data file (resets ALL content to seed defaults)**
```bash
rm data/restaurant.json
# Site reverts to src/lib/restaurant-data.ts defaults (isLocked: false).
```

**Option C — SSH one-liner**
```bash
ssh user@server "cd /path/to/project && node -e \
  \"const fs=require('fs'); const d=JSON.parse(fs.readFileSync('data/restaurant.json','utf8')); d.isLocked=false; fs.writeFileSync('data/restaurant.json',JSON.stringify(d,null,2));\""
```

---

## Password management

The session cookie is an HMAC-SHA256 of the `CMS_ADMIN_PASSWORD` env var.
**Changing the password immediately invalidates all existing browser sessions** — useful
if a client somehow acquired the password and you need to lock them out.

To rotate:
1. Update `CMS_ADMIN_PASSWORD` in your environment / `.env.local`.
2. Restart the server.
3. Re-login at `/dashboard-x7k2`.

---

## Production deployment notes

This site uses a **file-based JSON store** (`data/restaurant.json`).

| Host | Status |
|------|--------|
| Local / VPS / bare Node.js | ✅ Works out of the box |
| Vercel (Serverless Functions) | ⚠️ `/tmp` is writable but ephemeral between cold starts — data will be lost |
| Vercel (Edge Functions) | ❌ No filesystem access |
| Railway / Render / Fly.io (persistent volume) | ✅ Works with a persistent volume mounted at the project root |

**Recommendation for production Vercel**: Replace `cms-store.ts` with a
Vercel KV (Redis) or Neon (Postgres) backed store. The `getRestaurantData` /
`saveRestaurantData` function signatures stay the same — only the implementation changes.

---

## File reference

```
src/lib/restaurant-data.ts   — Typed schema + Litup Cafe seed defaults
src/lib/cms-store.ts         — File-based persistence (Node.js only)
src/lib/cms-actions.ts       — TanStack Start server functions (public API)
src/routes/dashboard-x7k2.tsx — Password-gated CMS admin form
data/restaurant.json          — Runtime data (git-ignored, created on first save)
public/uploads/               — Uploaded images (git-ignored)
.env.example                  — Copy to .env.local and set CMS_ADMIN_PASSWORD
```
