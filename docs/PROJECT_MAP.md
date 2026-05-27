# Abundapp — Project Map (AUTHORITATIVE)

> Single source of truth for every piece of Abundapp.
> Last verified: 2026-05-27 (post-deploy de Fase 2.1 Resumen pro — Cash Flow + Pacing + Tendencia 6m + Insights; SW v8)
> Master doc in Notion: https://www.notion.so/31dabb3a77da8065bc45ce9774759ffe

---

## LIVE APP

**URL:** https://abundapp.pages.dev
**Hosting:** Cloudflare Pages (auto-deploys from GitHub `main`)
**Auth:** Cloudflare Access OTP — only 2 emails authorized:
- `juandavid.gomezdiaz@gmail.com`
- `nickytorres94@hotmail.com`

**Status:** Running in production for ~1 month. Used daily by Juan David & Nicolle.

---

## STACK (data flow)

```
User (phone/browser)
    ↓
abundapp.pages.dev          ← Cloudflare Pages
    ↓
Cloudflare Access OTP       ← authentication
    ↓
index.html (PWA)            ← frontend
    ↓ fetch()
Google Apps Script Web App  ← backend API
    ↓
Google Sheet v3 MASTER      ← database
```

Separate AI access path:
```
Claude / AI client → abundapp-mcp.juandavid-gomezdiaz.workers.dev/mcp → Apps Script → Sheet
```

---

## EVERY IMPORTANT URL, ID, AND CREDENTIAL

| Resource | Value |
|---|---|
| Live app | `https://abundapp.pages.dev` |
| GitHub repo | `https://github.com/superjuanda/abundapp` ⚠️ currently PUBLIC — should be private |
| Google Sheet (database) | `https://docs.google.com/spreadsheets/d/1yk_KJ-aaNhOy2bENo_-QBPSmSZk2eW5qSK3rIRX4p58/edit` |
| Sheet ID | `1yk_KJ-aaNhOy2bENo_-QBPSmSZk2eW5qSK3rIRX4p58` |
| Apps Script Web App URL | `https://script.google.com/macros/s/AKfycbwXjq3YLgngJTLV9VSpfh9U07fkK_GOlh8t1ewtPraN6CLF3ZyCRd-_vpW24s84sG-DRA/exec` |
| MCP Worker (AI access) | `https://abundapp-mcp.juandavid-gomezdiaz.workers.dev/mcp` |
| API shared secret | `abundapp-familia-2026` |
| Cloudflare dashboard | `dash.cloudflare.com` → Zero Trust → Access → Applications |

---

## WHERE THE CODE LIVES

### Frontend PWA (working folder — edit here)
```
~/Documents/Abundapp Proyecto con Claude/abundapp/
```
Git repo on branch `main`, pushes to GitHub which auto-deploys to Cloudflare Pages.

Key files:
- `index.html` — the entire PWA (HTML/CSS/JS in one file, ~95KB). Tab Registro incluye desde Mayo 2026: (a) bloque "⚡ Entradas frecuentes" con chips de los combos `(categoría, subcategoría, monto)` más usados en los últimos 60 días (`computeFrequentEntries/renderQuickEntries/useQuickEntry`), y (b) banner de alertas de presupuesto cuando una categoría cruza 50/75/85/90/100% (`computeBudgetAlerts/renderAlertBanner/dismissAlert`, descarte persistente en `localStorage['abundapp_dismissed_alerts_v1']`). Tab Resumen incluye desde Mayo 27, 2026 (Fase 2.1): 4 dashboard cards (Cash Flow, Pacing, Tendencia 6m, Insights automáticos) que se muestran solo en el mes actual (`loadResumenDashboard/renderCashFlowCard/renderPacingCard/renderTrendCard/renderInsightsCard/generateInsights`), consumiendo `getDashboard` ya extendido en mayo
- `sw.js` — service worker (offline)
- `manifest.json` — PWA install metadata
- `Abundapp.png`, `Abundapp_white.png`, `icons/` — branding
- `apps-script/Code.gs` — source copy of the deployed backend
- `docs/` — PRD, test commands, this map

### MCP Worker (AI access layer)
```
~/Documents/Abundapp Proyecto con Claude/abundapp-mcp/
```
Cloudflare Worker. Deployed via `wrangler`. Not part of the PWA repo. Serves the `/mcp` endpoint that Claude and other AI clients use to read/write Sheet data.

### Deployed Apps Script (backend)
Inside the Google Sheet → **Extensions → Apps Script**. The code running in production lives there. The file `apps-script/Code.gs` in the repo is the source-of-truth copy. **Keep in sync:** when you edit one, copy to the other.

---

## TECHNICAL DOCUMENTATION (second folder)

Deep technical docs live separately on the Mac — originally created for AI agents to read quickly:

```
~/Documents/Claude/Outputs/Documentos/Abundapp-Project/
```

| File | Contents |
|---|---|
| `ARCHITECTURE.md` | Stack, URLs, IDs, file structure, sheet tabs, deploy flow |
| `API.md` | All endpoints (POST/GET), formats, examples, errors |
| `DECISIONS.md` | 18 technical decisions with reasoning and rejected alternatives |
| `CHANGELOG.md` | Full change history + roadmap |

**These are NOT in git.** They're standalone reference docs. To have an AI agent get up to speed, say: *"Read the files in ~/Documents/Claude/Outputs/Documentos/Abundapp-Project/"*

---

## GOOGLE SHEET — 10 tabs

| Tab | Purpose |
|---|---|
| Catálogo | Master list: 17 categories, 80 subcategories |
| Transacciones | All registered expenses (auto-ID and auto-month formulas) |
| Plantilla Presupuesto | Base budget amounts per subcategory (copied each month) |
| Presupuesto Mes Activo | Current month budget vs actual (SUMIFS) |
| Historial Mensual | Archive of closed months with totals. Stores both expenses (no prefix in col B) and incomes (prefix `📥 ` in col B). Col A is a Date (serial number), NOT a string. |
| Dashboard | Two zones: Legacy (rows 1-28, read by API) + Analysis (rows 30-74, Sheet-view only with Ingresos/Cash Flow/Pacing/Alertas/Top5/Tendencia) |
| Notas | Family financial notes |
| Config | Payment methods and users |
| **Plantilla Ingresos** *(NEW)* | Base recurring income template — 11 categories incl. Sueldo JD, Sueldo Nicolle, Expansora |
| **Ingresos Mes Activo** *(NEW)* | Live month income tracking — Proyectado (formula) / Real (manual) / Varianza / % / Estado |

Spreadsheet location in Drive:
```
Google Drive / Mi unidad / Vida Personal / Finanzas Personales /
  Abundapp MASTER Aplicacion / Abundapp_Gastos_Familia_2026_v3_ MASTER.gsheet
```

---

## WHAT IS *NOT* THE WORKING VERSION

| Path | What it is |
|---|---|
| `Google Drive / .../ARCHIVE - old code copies (see GitHub for latest)/` | Renamed on 2026-04-19. Old manual code copies. Reference only — do not edit. |
| `abundapp-backup-original/` (deleted 2026-04-19) | Was redundant. Moved to Trash. GitHub has history. |

---

## WORKFLOW FOR JUAN DAVID

Tell Claudio: **"Changes to Abundapp."**

Claudio will:
1. Go to `~/Documents/Abundapp Proyecto con Claude/abundapp/`
2. Make edits
3. Test
4. Commit with a clear message
5. Push to GitHub → auto-deploys to `abundapp.pages.dev`
6. If `Code.gs` changed: also update the deployed Apps Script (Sheet → Extensions → Apps Script → paste → Deploy new version)
7. **If `index.html` changed: bump `sw.js` `CACHE_NAME` (vN → vN+1).** Sin este bump, el SW sirve la versión cacheada vieja y los usuarios no ven los cambios. Lección aprendida 2026-05-27.

**Never:**
- Edit files directly in Google Drive archive
- Push to `main` without testing
- Expose the API key in a public repo
- Modificar `index.html` sin bumpear `sw.js` (regla de oro post-2026-05-27)

---

## HEALTH MONITORING

Dedicated Claude skill: **`/abundapp-health`**

- Location: `~/.claude/skills/abundapp-health/`
- What it does: runs ~23 checks (live app, backend, auth, repo, drift, Fase 1.1 + 1.2 features), writes a dated report, detects when new Apps Script actions or PWA features are added and prompts to extend coverage
- Version 1.4.0 (2026-05-27) extends coverage with Fase 2.1 Resumen pro checks (cash flow / pacing / trend / insights cards + functions) and SW min version v8
- Reports: `~/.claude/skills/abundapp-health/reports/YYYY-MM-DD-HHMM.md`
- Baseline: `~/.claude/skills/abundapp-health/state.json`
- Check registry: `~/.claude/skills/abundapp-health/checks.json`
- First baseline: `reports/2026-04-19-1854.md`

**Run it:** say "/abundapp-health" or "check abundapp health". The skill evolves — every time you add a feature or endpoint, the next run flags it as "needs coverage" and proposes adding a check.

---

## KNOWN ISSUES TO RESOLVE

1. ~~**GitHub repo is PUBLIC**~~ — resolved 2026-04-19, now private ✓
2. ~~**3 local commits unpushed**~~ — resolved 2026-05-06 ✓
3. **Apps Script sync** — Code.gs in repo is now at 1160 lines (post-Mayo 2026 income tracking). Behaviorally verified post-deploy (getDashboard returns new fields). Always copy from `apps-script/Code.gs` to the Apps Script editor when changes are made.
4. **closeMonth missed TOTAL row for Marzo 2026** — bug in closeMonth at the time of cierre de marzo. Abril has TOTAL row, marzo does not. Doesn't affect monthlyTrend (which aggregates by date, not by TOTAL marker). Low priority, fix when convenient.
5. **closeMonth income archival pending real validation** — the closeMonth() function now archives incomes too (deployed 2026-05-07). First real test will be on 2026-06-01 when checkMonth() auto-fires for May closure. Worth observing.
