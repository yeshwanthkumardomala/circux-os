<div align="center">

# ◈ CIRCUX OS

### The Operating Workspace for STEM & Robotics

**Build. Showcase. Evaluate.**

**sidya.v05** · Developed by **Yeshwanthkumardomala**

A modern workspace for organizing robotics projects, presenting student innovations, and managing STEM exhibitions — from project documentation to QR-powered display workflows.

<p>
  <a href="https://circux-os.vercel.app/"><strong>↗ Launch Live Demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/yeshwanthkumardomala/circux-os"><strong>Explore the Source</strong></a>
</p>

![Next.js](https://img.shields.io/badge/Next.js-Framework-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-Typed-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![CI](https://github.com/yeshwanthkumardomala/circux-os/actions/workflows/ci.yml/badge.svg)

</div>

---

## ◈ About Circux

Circux OS is a browser-based platform for **STEM educators, robotics labs, students, and exhibition teams**. It brings project organization, documentation, presentation, and judging into one workspace.

Designed for local exhibition workflows, Circux supports QR-based project access and phone-to-display pairing. The current build is a tested prototype, not a fully managed multi-user production service: persistence, identity management, and live sensor telemetry require additional infrastructure.

## 📸 Live deployment preview

The following preview is captured from the public Vercel deployment. It may refresh as the deployment changes.

[Open CIRCUX OS in your browser](https://circux-os.vercel.app/)

![CIRCUX OS live deployment screenshot](https://image.thum.io/get/width/1200/crop/900/noanimate/https://circux-os.vercel.app/)

> Mobile UI note: saved project readings are labelled as reference data. Live telemetry and physical controls stay unavailable until a verified hardware adapter is configured. A global project search is available from the workspace header.

## ✦ Core Features

| Feature | What it does |
| --- | --- |
| **Project Workspace** | Organize, edit, hide/show, and delete project records, teams, categories, status, and summaries. |
| **Project Documentation** | Save report drafts, project stories, circuit information, and project file/link references. |
| **QR Project Access** | Open project details from scannable QR cards. |
| **Display Pairing** | Pair a phone with an exhibition display over a local network. |
| **Dual-Project Showcase** | Present two projects in Slot A and Slot B, with clear and swap controls. |
| **Judging Workflow** | Record and display project evaluation scores. |
| **Project readings** | Display saved reference values; live telemetry requires connected hardware. |

## ⟡ Technology Stack

<div align="center">

| Layer | Technology |
| --- | --- |
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend foundation | FastAPI |
| Exhibition relay | Node.js, Server-Sent Events |
| Deployment | Vercel (frontend) |

</div>

## ⚡ Quick Start

### Requirements

- Node.js and npm
- Git (recommended)

### Run the frontend

```bash
git clone https://github.com/yeshwanthkumardomala/circux-os.git
cd circux-os
npm install
npm run dev
```

Open **http://localhost:3000** in your browser.

### Run the exhibition workflow

First copy `.env.example` to `.env`, then edit the file and set a long random `CIRCUX_ADMIN_TOKEN`. The relay reads `.env` automatically. Keep `.env` private and do not commit it.

For the local app, authenticated exhibition relay, QR pairing, uploads, judging, and display pairing, run:

```bash
npm run exhibition
```

Open the display at **http://localhost:3000/display**. For phone pairing, use the host computer's LAN IP address instead of `localhost`, and connect both devices to the same trusted Wi-Fi network.

For Windows, the repository also includes `RUN-CIRCUX.bat`. See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and [HARDWARE.md](HARDWARE.md) for additional setup and integration details.

## ◈ Feature Status

| Capability | Current status |
| --- | --- |
| Project workspace and showcase | Functional locally; project/config sync to the authenticated relay when reachable |
| QR project pages | Built-in examples work online; custom projects need the local relay on the same reachable network |
| Reports and settings | Saved in browser storage and synced to the local relay when available |
| Judging | Saved to the authenticated relay; browser-local fallback when offline |
| Uploads | File contents are stored by the local relay under `.circux-data/uploads/<project-id>/`; offline browser fallback retains filenames only |
| Sensor telemetry | Not configured; saved values are reference data and no synthetic feed is generated |
| Cloud database/API | Not connected; Vercel currently hosts the frontend only |
| Relay authentication | Shared admin token protects relay reads and mutations; user roles are not implemented |
| Direct hardware control | Disabled by default and out of scope for this update |

## 🔐 Security & Data Notes

See [SECURITY.md](SECURITY.md) for safe deployment guidance and vulnerability reporting.

- The local relay persists projects, settings, judging, and upload metadata in `.circux-data/store.json`; upload bytes are stored under `.circux-data/uploads`.
- Project external links are saved with project records; uploaded files are organized in per-project folders.
- Display pairing sessions remain in memory and expire after the configured inactivity timeout.
- Browser-local storage is an offline fallback and does not synchronize between browsers without the relay.
- The Vercel site has no configured relay URL or database environment variables; use the local exhibition workflow for shared event data.
- Keep device keys and admin tokens private. Do not commit secrets to the repository.

## 🚀 Production-readiness checklist

Before using this with real students, judges, or devices:

- [ ] Add durable server-side storage and backups for projects, reports, uploads, and judging.
- [ ] Implement user accounts, role-based permissions, session expiry, and audit logs.
- [ ] Configure production environment variables in Vercel and any separately hosted relay/backend.
- [ ] Use HTTPS/WSS for all remote device and relay traffic; avoid exposing admin tokens in URLs.
- [ ] Run end-to-end tests on mobile and desktop against the deployed environment.
- [ ] Test upload limits, recovery, rate limiting, and backup/restore procedures.
- [ ] Validate every hardware command with a physical interlock and fail-safe state.

CI verifies type checking, relay smoke/security tests, search coverage, production build, and Python backend tests. A green CI run does not itself prove that Vercel environment variables, external services, or physical hardware are configured correctly.

## Functional mode update (October 2026)

The workspace now loads and syncs project/config records through the local relay, supports selecting a project in Showcase, Documentation, and Judging, and displays actual relay/device availability. The relay no longer emits synthetic sensor readings. Reference values in starter project records are not live telemetry.

The Projects page includes edit, hide/show, and delete actions. Settings includes light/dark theme controls. Missing project details remain empty instead of borrowing readings from another project. The loading screen shows the Circux and sidya.v05 logos, and the site credits sidya.v05 and Yeshwanthkumardomala.

For Windows, `RUN-CIRCUX.bat` creates a random `CIRCUX_ADMIN_TOKEN` when one is not configured, saves it in the ignored `.env` file, and prints it in the launch terminal. In the admin Settings page, paste it once into **Local backend access** and save it to this browser; it can then be revealed or copied there and is also used by Board Health. The frontend cannot read `.env` automatically. This admin token is different from each board/device token. The local FastAPI docs are at `http://localhost:8000/docs` while the backend is running.

To point a browser build at a relay reachable by its users, set `NEXT_PUBLIC_CIRCUX_RELAY_URL` at build time and allow the frontend origin in `CIRCUX_ALLOWED_ORIGIN`. Do not point the public Vercel site at a private LAN address. Supabase is active, but currently has no application tables; Vercel has no database/backend environment configured. Shared cloud persistence is therefore unavailable. Use the local exhibition server for shared event data on the venue LAN.

## 🧭 Roadmap

- [ ] Persistent project and judging storage
- [ ] Authentication and role-based access
- [ ] More complete hardware adapter integrations
- [ ] Automated tests for pairing, projects, and judging
- [ ] Improved reporting and export workflows

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

## 📄 License

Check the repository for a license file before reusing or redistributing this project.

---

<div align="center">

**CIRCUX OS** · Explore. Build. Demonstrate. Innovate.

<sub>Built for connected STEM and robotics experiences.</sub>

</div>
