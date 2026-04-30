#!/usr/bin/env node
// Pull every upload referenced in the production DB but missing from this
// machine's `backend/uploads/` directory. Reads credentials from
// `scripts/.env.sync` (preferred) or process.env. Zero npm dependencies.

import { readFileSync, existsSync, mkdirSync, statSync, createWriteStream, renameSync, unlinkSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const __filename = fileURLToPath(import.meta.url)
const SCRIPT_DIR = dirname(__filename)
const REPO_ROOT = resolve(SCRIPT_DIR, '..')

const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', cyan: '\x1b[36m', gray: '\x1b[90m',
}
const log = {
  info: (m) => console.log(`${c.cyan}ℹ${c.reset}  ${m}`),
  ok: (m) => console.log(`${c.green}✓${c.reset}  ${m}`),
  warn: (m) => console.log(`${c.yellow}⚠${c.reset}  ${m}`),
  err: (m) => console.error(`${c.red}✗${c.reset}  ${m}`),
  step: (m) => console.log(`\n${c.bold}${c.blue}▸ ${m}${c.reset}`),
  dim: (m) => console.log(`${c.gray}${m}${c.reset}`),
}

function loadDotEnvSync() {
  const envFile = join(SCRIPT_DIR, '.env.sync')
  if (!existsSync(envFile)) return {}
  const out = {}
  const text = readFileSync(envFile, 'utf8')
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

function getConfig() {
  const fileEnv = loadDotEnvSync()
  const env = { ...fileEnv, ...process.env }
  const required = ['PROD_API_URL', 'PROD_ADMIN_USERNAME', 'PROD_ADMIN_PASSWORD']
  const missing = required.filter((k) => !env[k] || env[k].trim() === '')
  if (missing.length > 0) {
    log.err(`Missing required env vars: ${missing.join(', ')}`)
    log.dim(`Copy scripts/.env.sync.example → scripts/.env.sync and fill it in.`)
    process.exit(1)
  }
  const skipDbSync = env.SKIP_DB_SYNC === '1' || env.SKIP_DB_SYNC === 'true'
  return {
    prodApiUrl: env.PROD_API_URL.replace(/\/+$/, ''),
    prodUsername: env.PROD_ADMIN_USERNAME,
    prodPassword: env.PROD_ADMIN_PASSWORD,
    localApiUrl: (env.LOCAL_API_URL || 'http://localhost:8089').replace(/\/+$/, ''),
    localUsername: env.LOCAL_ADMIN_USERNAME || 'admin',
    localPassword: env.LOCAL_ADMIN_PASSWORD || 'admin123',
    uploadsDir: resolve(REPO_ROOT, env.LOCAL_UPLOADS_DIR || 'backend/uploads'),
    concurrency: Math.max(1, parseInt(env.SYNC_CONCURRENCY || '4', 10)),
    skipDbSync,
  }
}

async function login(apiUrl, username, password) {
  const res = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    throw new Error(`Login failed: HTTP ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  if (!data.authenticated || !data.token) {
    throw new Error(`Login refused: ${data.errorCode || 'unknown'}`)
  }
  if (data.role !== 'ADMIN') {
    throw new Error(`Account "${username}" is not an admin (role=${data.role}). Use an admin account.`)
  }
  return data.token
}

async function fetchManifest(apiUrl, token) {
  const res = await fetch(`${apiUrl}/api/admin/uploads/manifest`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`Manifest fetch failed: HTTP ${res.status} ${res.statusText}`)
  }
  return res.json()
}

async function postImageMapping(apiUrl, token, mappings) {
  const res = await fetch(`${apiUrl}/api/admin/uploads/image-mapping/sync`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items: mappings }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Image-mapping sync failed: HTTP ${res.status} ${res.statusText} ${body}`)
  }
  return res.json()
}

async function downloadFile(apiUrl, filename, destPath) {
  const url = `${apiUrl}/uploads/${encodeURIComponent(filename)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  if (!res.body) {
    throw new Error('empty body')
  }
  const tmpPath = destPath + '.part'
  try {
    await pipeline(Readable.fromWeb(res.body), createWriteStream(tmpPath))
    renameSync(tmpPath, destPath)
  } catch (err) {
    if (existsSync(tmpPath)) {
      try { unlinkSync(tmpPath) } catch { /* ignore */ }
    }
    throw err
  }
}

function fmtBytes(n) {
  if (n == null) return '?'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

async function runPool(items, concurrency, worker) {
  const results = []
  let cursor = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++
      const item = items[idx]
      try {
        const out = await worker(item, idx)
        results.push({ ok: true, item, out })
      } catch (err) {
        results.push({ ok: false, item, err })
      }
    }
  })
  await Promise.all(runners)
  return results
}

async function main() {
  const cfg = getConfig()

  log.step('Connecting to production')
  log.dim(`  Prod API: ${cfg.prodApiUrl}`)
  log.dim(`  Account:  ${cfg.prodUsername}`)
  log.dim(`  Target:   ${cfg.uploadsDir}`)
  log.dim(`  Workers:  ${cfg.concurrency}`)

  const prodToken = await login(cfg.prodApiUrl, cfg.prodUsername, cfg.prodPassword)
  log.ok('Authenticated to production as admin')

  log.step('Fetching production manifest')
  const manifest = await fetchManifest(cfg.prodApiUrl, prodToken)
  log.ok(`Manifest: ${manifest.totalCount} entries (${manifest.presentCount} present, ${manifest.missingCount} missing on prod)`)

  // ---------- Step 1: sync DB image_url mapping into the LOCAL backend ----
  if (cfg.skipDbSync) {
    log.warn('SKIP_DB_SYNC=1 — leaving local craft_items.image_url untouched.')
  } else {
    log.step('Syncing image_url mapping to local DB')
    log.dim(`  Local API: ${cfg.localApiUrl}`)
    log.dim(`  Account:   ${cfg.localUsername}`)

    let localToken
    try {
      localToken = await login(cfg.localApiUrl, cfg.localUsername, cfg.localPassword)
    } catch (err) {
      log.err(`Could not log in to local backend: ${err.message}`)
      log.dim('  Make sure the local backend is running, or set SKIP_DB_SYNC=1 to bypass DB sync.')
      process.exit(1)
    }

    const mappings = manifest.items.map((e) => ({
      itemId: e.itemId,
      imageUrl: e.imageUrl,
    }))
    const result = await postImageMapping(cfg.localApiUrl, localToken, mappings)
    log.ok(`DB sync: updated=${result.updated}, unchanged=${result.unchanged}, notFound=${result.notFound}`)
    if (result.notFound > 0) {
      log.dim(`  notFoundIds: ${result.notFoundIds.join(', ')}`)
      log.dim('  These item IDs exist on prod but not locally — your local seed is older. ' +
              'Their images will still be downloaded so they show up if you import the rows later.')
    }
  }

  // ---------- Step 2: download missing files ------------------------------
  if (!existsSync(cfg.uploadsDir)) {
    mkdirSync(cfg.uploadsDir, { recursive: true })
    log.info(`Created ${cfg.uploadsDir}`)
  }

  const toDownload = []
  let alreadyHave = 0
  for (const entry of manifest.items) {
    if (!entry.exists) continue
    const local = join(cfg.uploadsDir, entry.filename)
    if (existsSync(local)) {
      const localSize = statSync(local).size
      if (entry.sizeBytes != null && localSize === entry.sizeBytes) {
        alreadyHave++
        continue
      }
    }
    toDownload.push(entry)
  }

  log.step('File-download plan')
  log.dim(`  Already in sync: ${alreadyHave}`)
  log.dim(`  Will download:   ${toDownload.length}`)
  log.dim(`  Skipped (missing on prod too): ${manifest.missingCount}`)

  if (toDownload.length === 0) {
    log.ok('All files are already up to date.')
    return
  }

  log.step(`Downloading ${toDownload.length} file(s)`)
  let done = 0
  const results = await runPool(toDownload, cfg.concurrency, async (entry) => {
    const dest = join(cfg.uploadsDir, entry.filename)
    await downloadFile(cfg.prodApiUrl, entry.filename, dest)
    done++
    process.stdout.write(`  ${c.green}✓${c.reset} [${done}/${toDownload.length}] ${entry.filename} ${c.gray}(${fmtBytes(entry.sizeBytes)})${c.reset}\n`)
    return entry.sizeBytes ?? 0
  })

  const failures = results.filter((r) => !r.ok)
  const successes = results.filter((r) => r.ok)
  const totalBytes = successes.reduce((s, r) => s + (r.out || 0), 0)

  log.step('Summary')
  log.ok(`Downloaded: ${successes.length} (${fmtBytes(totalBytes)})`)
  if (alreadyHave > 0) log.dim(`Up-to-date: ${alreadyHave}`)
  if (failures.length > 0) {
    log.warn(`Failed:     ${failures.length}`)
    for (const f of failures) {
      log.dim(`    ${f.item.filename} — ${f.err.message}`)
    }
    process.exitCode = 1
  }
}

main().catch((err) => {
  log.err(err.message)
  if (process.env.DEBUG) console.error(err)
  process.exit(1)
})
