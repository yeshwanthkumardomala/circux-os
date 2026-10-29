# Circux OS

## Repository and project handoff

GitHub repository: https://github.com/yeshwanthkumardomala/circux-os

The source code is hosted online on GitHub. The live Circux application remains local to the event computer and LAN; GitHub does not run the FastAPI backend or hardware connections.

Full development history, architecture, setup, security notes, testing, and future work: [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

For the simplest Windows launch, double-click [RUN-CIRCUX.bat](RUN-CIRCUX.bat). It starts the local FastAPI backend and LAN-accessible frontend. The launcher asks for `CIRCUX_ADMIN_TOKEN`; this is a private local secret and is intentionally not stored in GitHub.

Circux OS is a locally runnable showcase and administration prototype for robotics, electronics, STEM projects, documentation, exhibitions, simulated monitoring, and judging.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a complete exhibition session with the app, LAN relay, pairing QR, and simulated live feeds, use one command:

```bash
npm run exhibition
```

The FastAPI backend foundation can be started separately with `npm run backend` on port `8000`. The existing Node relay remains available for the current display pairing flow while the device API is migrated.

Open `http://localhost:3000/display` on the large display. Scan its pairing QR with a phone, then scan any project QR and choose Slot A or Slot B. The relay runs on port `3002` and keeps the two-slot session in memory.

Use `http://localhost:3000/qr-test` to test three scannable project QR cards. For phones, open the LAN-IP version of that URL so the QR links are reachable over Wi‑Fi.

To automatically commit and push changes every 15 minutes, run this in a separate terminal. It waits 15 minutes before the first push:

```bash
npm run auto-push
```

For the large judge display, run a second process in another terminal:

```bash
npm run dev:display
```

Open `http://localhost:3001/display/CX-104` or `http://localhost:3001/display?ids=CX-104,CX-106`. For phone scanning over Wi-Fi, use the computer's LAN IP (for example `http://192.168.1.20:3000`) instead of `localhost`.

## Production build

```bash
npm run build
npm start
```

The workspace remains browser-first: reports, uploads, telemetry, power states, and judge actions are local or simulated. The exhibition relay is a small in-memory backend for sharing projects/config with display phones; it is not a persistent production database. Uploaded files are registered by name only and are not sent to a server.

The exhibition relay now provides a small shared backend for project/config sync and optional hardware testing. See `HARDWARE.md`; hardware commands require `CIRCUX_DEVICE_KEY` and an adapter URL, and the relay must remain on a trusted network.

## Review notes

- The core flow is interactive: dashboard → projects → builder → documentation → showcase → judging.
- Project records, theme, upload names, report drafts, judging scores, and showcase state use browser-local storage.
- The materials audit remains available as supporting data, but the main UI is intentionally showcase-first rather than a materials catalog.
- Project QR cards open mobile detail pages with sample team, readings, documentation, circuit, and development-video content.
- The QR image is fetched from a small online QR image service in this frontend-only phase; the project URL itself remains local to the event Wi-Fi.
- Phone-to-screen switching is available over the local relay during `npm run exhibition`; the relay is intended for a trusted event Wi-Fi and resets when it stops.

## Current work context

Work completed in the current session:

- Initialized Git and pushed the Circux OS prototype to `https://github.com/yeshwanthkumardomala/circux-os.git` on branch `main`.
- Added a LAN relay on port `3002` using native Node HTTP and Server-Sent Events.
- Added display pairing by QR, phone-to-display project selection, Slot A / Slot B control, clear, and swap actions.
- Added a two-project display with project story, photos, documents, videos, simulated live readings, status, and update times.
- Added the three-project QR test bench at `/qr-test` for CX-101, CX-102, and CX-103.
- Added `npm run exhibition` to start the Next app and relay together.
- Added `npm run auto-push`, which waits 15 minutes before its first commit/push and repeats on a 15-minute interval.
- Fixed LAN QR generation so a display opened through `localhost` advertises the reachable Wi-Fi address instead of giving phones an unusable `localhost` link.
- Fixed hydration errors caused by host-dependent QR and relay URLs being different during server rendering and browser hydration.

Latest verified LAN test URLs on the current Wi-Fi:

- Display: `http://10.14.231.177:3000/display`
- QR test bench: `http://10.14.231.177:3000/qr-test`
- Relay health: `http://10.14.231.177:3002/health`

Verification completed: production build passed before the final hydration-only fix, TypeScript checking passed after it, the display, project, pairing, and QR test routes returned HTTP 200, and relay session/slot updates were tested successfully.

Known limits: project data and relay state are still in memory/browser storage; live readings are simulated; media uses URLs; no hardware, authentication, cloud database, or persistent event history is connected.

## Admin and mobile presentation

The Settings panel now edits workspace identity, venue, event date, display defaults, slot defaults, feed labeling, and complete project records. Project records can be edited locally for names, student roles, category, status, progress, summaries, readings, photos, document links, video links, and circuit stories. Use “Export all config” before changing browsers.

On a phone, use the LAN URL and choose the browser’s “Add to Home screen” / “Install app” option. Circux includes a standalone PWA manifest for a compact app-like experience; a signed native Android APK is intentionally outside this frontend-only prototype.
