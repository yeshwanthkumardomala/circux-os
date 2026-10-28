# Circux OS

Circux OS is a locally runnable showcase and administration prototype for robotics, electronics, STEM projects, documentation, exhibitions, simulated monitoring, and judging.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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

The prototype is frontend-only. Project records, reports, uploads, telemetry, power states, and judge actions are simulated in browser state; no hardware, backend, cloud service, or shared database is connected. Browser-local state is suitable for a prototype, not a multi-user production system. Uploaded files are registered by name only and are not sent to a server.

## Review notes

- The core flow is interactive: dashboard → projects → builder → documentation → showcase → judging.
- Project records, theme, upload names, report drafts, judging scores, and showcase state use browser-local storage.
- The materials audit remains available as supporting data, but the main UI is intentionally showcase-first rather than a materials catalog.
- Project QR cards open mobile detail pages with sample team, readings, documentation, circuit, and development-video content.
- The QR image is fetched from a small online QR image service in this frontend-only phase; the project URL itself remains local to the event Wi-Fi.
- Phone-to-screen switching is simulated locally until a backend relay is added.
