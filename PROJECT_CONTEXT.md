# Circux OS — Project Development and Handoff Document

Repository: https://github.com/yeshwanthkumardomala/circux-os

The repository is the permanent code/documentation link. The cloud workspace is deployed on Vercel with Supabase services; the local FastAPI agent remains necessary for USB hardware on the venue network. GitHub stores and deploys source code, not the hardware agent.

Online frontend demo: https://circux-os.vercel.app/

## Current status — October 30, 2026

This section supersedes older prototype/cloud-status notes later in this document. Cloud infrastructure is now connected; this is still not a fully hardware-validated production release.

- Vercel project `circux-os` has `NEXT_PUBLIC_SUPABASE_URL` and the Supabase publishable key configured for production, preview, and development. These are public browser values; RLS protects data. No service-role key is in the frontend.
- Supabase project `pluvaeplyqvwoctnxowc` has PostgreSQL tables, RLS, Auth profile trigger, private Storage bucket, role policies, score validation, audit triggers, public project search, universal authenticated search, and capability-based cloud display pairing.
- Sign-up creates a `viewer`. The first owner must sign up, then an operator must promote that account once in Supabase SQL Editor using the instructions in `README.md`. Afterward, account role changes are available in admin Settings.
- Cloud project/report/settings/judging data and uploads persist in Supabase. There are no seeded sample projects in cloud mode.
- Local FastAPI remains SQLite-backed on the venue computer; it is not the cloud database API. It now offers authenticated Arduino CLI detect/compile/upload endpoints and validated serial JSON telemetry. The serial firmware must emit reader data as JSON; no specific RFID reader has been physically validated.
- Cloud display pairing polls Supabase; local exhibition mode still uses the Node relay/SSE.
- Tests run in this implementation: TypeScript, global-search coverage, upload-policy guard, relay smoke, 11 Python unit tests, cloud-mode production build, and npm audit (zero vulnerabilities). Next.js 16 warns that React 18 support is deprecated; build remains successful.
- Physical hardware validation is blocked by the current workstation reporting `No boards found.` Cloud signup/role-permission E2E flows also await the owner account and Supabase Auth redirect configuration.

Current Supabase migrations are in `supabase/migrations/`; apply them in order for a new environment. Production verification, backup/restore drill, long-run load test, and the account-provisioned browser walkthrough remain open.

## 1. Purpose

Circux OS is a local exhibition platform for student projects. It provides a dashboard, project builder, public QR pages, judge displays, phone-to-display pairing, documentation, uploads, judging, project monitoring, and a hardware-readings path.

The intended event setup is one main computer running the web app and local API, a private mobile hotspot or router, phones/displays on the same LAN, and Arduino/ESP boards connected directly by Wi-Fi or through USB-connected helper laptops.

## 2. Development history

### Prototype foundation

- Built the Next.js browser workspace and exhibition screens.
- Added built-in project records and public project routes.
- Added project QR pages, display pages, simulated readings, documentation, uploads, and judging UI.
- Added responsive visual layout and PWA/offline fallback assets.

### Exhibition workflow

- Added the local Node relay for trusted-LAN display pairing.
- Added display pairing QR, phone slot selection, Slot A/Slot B switching, clear, and swap.
- Added LAN-aware QR URLs so phones do not receive unusable `localhost` links.
- Added project/config synchronization and relay persistence under `.circux-data`.
- Added relay body limits, session expiry, device-key protection, health, readings, and command routes.

### Reliability and persistence

- Added local project, report, judging, configuration, and upload handling.
- Added report export and QR download/print actions.
- Added relay smoke testing.
- Added production build verification.

### Hardware and backend foundation

- Added FastAPI on port 8000.
- Added SQLite storage, audit records, admin-token protection, board registration, heartbeats, readings, history, uploads, and WebSocket project updates.
- Added a USB serial agent for Arduino laptops. It sends readings and heartbeats only and does not send actuator commands.
- Added board health screen and stale-board detection after 15 seconds without a heartbeat.
- Added project-specific dashboard metrics and display-only emergency fallback.

## 3. Current architecture

```text
GitHub repository
        |
Main event computer
  Next.js :3000  ---- browser pages, QR, judge display
  FastAPI :8000  ---- SQLite, boards, readings, uploads, fallback
  Node relay :3002 ---- local-mode phone/display pairing
  Supabase ---- cloud-mode database, auth, uploads, and display pairing
        |
Private hotspot/router LAN
  phones, judge displays, Arduino helper laptops, Wi-Fi boards
```

GitHub stores the source and backup. It does not run the local FastAPI or hardware services.

## 4. Security model

- Keep the event network private.
- Set `CIRCUX_ADMIN_TOKEN` on the main computer; never commit it.
- Use device tokens for board heartbeats and readings.
- Keep hardware read-only and low-heat during initial testing.
- Do not expose ports 3002 or 8000 directly to the public internet.
- Do not connect mains, pumps, heaters, or moving mechanisms until hardware safety testing is complete.
- Back up `.circux-data` and uploads before each event.

## 5. Admin token

There is no pre-created token. Create one locally in PowerShell:

```powershell
$env:CIRCUX_ADMIN_TOKEN = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

This value lasts only for the current PowerShell window. For a permanent local setup, put the token in a private `.env`/startup configuration, not in GitHub.

## 6. Run instructions

Install once:

```powershell
npm install
pip install -r backend\requirements.txt
```

Run the simple launcher: double-click `RUN-CIRCUX.bat`.

Manual run:

```powershell
$env:CIRCUX_ADMIN_TOKEN = "your-generated-token"
npm run backend
npm run dev -- --hostname 0.0.0.0
```

Open locally at `http://localhost:3000`. Phones use the main computer's hotspot IP, for example `http://192.168.43.10:3000`.

USB board example:

```powershell
python backend\agent.py --port COM6 --board-id CX-104-BOARD-1 --token DEVICE_TOKEN --api http://MAIN-COMPUTER-IP:8000
```

## 7. Verification completed

- `npm run build` — passed.
- `npm run test:relay` — passed.
- `python -m py_compile backend/app/main.py backend/agent.py` — passed.
- `git diff --check` — only reports an existing extra blank line at the end of `app/page.tsx`.

## 8. Required event-day checks

1. Start the hotspot/router and record its IP.
2. Start FastAPI and the frontend on the main computer.
3. Open Board Health and confirm the API is connected.
4. Register each board and save its device token securely.
5. Test every board in sensor-only mode for at least 10 minutes.
6. Walk to every arena position and test phone/display reachability.
7. Scan and download/print each project QR.
8. Test a project on a judge phone and display.
9. Disconnect one board and confirm it becomes stale.
10. Activate display-only fallback and confirm no hardware command is sent.
11. Back up `.circux-data` and uploads.

## 9. Known limits and next upgrades

- FastAPI remains local; the Node relay serves local-mode pairing while cloud-mode pairing uses Supabase capability RPCs.
- QR images currently use the external QR image service; local QR generation should be added for a fully offline event.
- Real hardware calibration, electrical safety, Wi-Fi range, and long-duration load testing still require physical testing.
- GitHub Pages cannot run this backend; the repository URL is the stable cloud handoff link. A public app URL requires a separate host such as Vercel or a server.
- Cloud app records use PostgreSQL. The local hardware API still uses SQLite; add local backup/restore automation and monitoring before a long-running event.

## 10. Handoff summary

The project is a strong local exhibition prototype with a working Next.js build, trusted-LAN relay, FastAPI hardware foundation, and documented operating procedure. Any future AI or developer should read this file, `README.md`, `HARDWARE.md`, and `.env.example` before changing the architecture.
