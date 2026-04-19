# Abundapp — Project Map

> Single source of truth for where every piece of Abundapp lives.
> Last updated: 2026-04-19

---

## THE WORKING FOLDER (where all code changes happen)

```
~/Documents/Abundapp Proyecto con Claude/abundapp/
```

This is the ONLY place code should be edited. It is a git repository connected to GitHub (`github.com/superjuanda/abundapp`, branch `main`).

### What's inside

| Path | What it is |
|---|---|
| `index.html` | The PWA (the app itself — all HTML/CSS/JS in one file) |
| `sw.js` | Service worker (offline support) |
| `manifest.json` | PWA manifest (icon, name, install metadata) |
| `Abundapp.png`, `Abundapp_white.png`, `icons/` | App icons |
| `apps-script/Code.gs` | Google Apps Script backend that reads/writes the spreadsheet |
| `docs/PRD_ABUNDAPP.md` | Product requirements doc |
| `docs/TEST_COMMANDS.md` | QA test commands |
| `docs/PROJECT_MAP.md` | **This file** |

---

## WHERE OTHER PIECES LIVE

### The spreadsheet (the database)

```
Google Drive / Mi unidad / Vida Personal / Finanzas Personales /
  Abundapp MASTER Aplicacion / Abundapp_Gastos_Familia_2026_v3_ MASTER.gsheet
```

This is the live data. The Apps Script in `apps-script/Code.gs` is bound to this sheet and serves as the backend API for the PWA.

### The Apps Script (deployed version)

The deployed, running copy of `Code.gs` lives inside Google Apps Script, bound to the spreadsheet above. Edit it by opening the sheet → Extensions → Apps Script.

**Rule:** After editing `Code.gs` in the local repo, copy the changes into the Apps Script editor and redeploy. Or edit in Apps Script and copy back to the repo. Keep both in sync.

### GitHub

```
https://github.com/superjuanda/abundapp
```

Backup and version history for the PWA code. Push happens from the local working folder.

---

## THINGS THAT ARE NOT THE WORKING VERSION (do not edit)

| Path | What it is | Action |
|---|---|---|
| `~/Documents/Abundapp Proyecto con Claude/abundapp-mcp/` | Separate Cloudflare Workers MCP server (different project) | Leave alone |
| `Google Drive / .../Abundapp MASTER Aplicacion /ARCHIVE - old code copies/` | Old manual copies of code, kept for reference | Do not edit |

Deleted on 2026-04-19: `abundapp-backup-original/` (was redundant — GitHub has full history).

---

## HOW TO MAKE CHANGES (workflow for Juan David)

Tell Claudio: **"Changes to Abundapp."**

Claudio will:
1. Go to `~/Documents/Abundapp Proyecto con Claude/abundapp/`
2. Make the edits
3. Test
4. Commit to git with a clear message
5. Push to GitHub
6. If `Code.gs` changed: remind you to update the deployed Apps Script

**Never:**
- Edit files in the Google Drive folder directly
- Edit files in `abundapp-backup-original` or other copies
- Push to `main` without testing
