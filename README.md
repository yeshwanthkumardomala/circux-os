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

Circux OS is a browser-based platform for **STEM educators, robotics labs, students, and exhibition teams**. It brings project organization, documentation, presentation, and judging into one workspace. Cloud mode uses Supabase Auth, PostgreSQL, RLS, and private object storage. The local Node relay/FastAPI services remain for LAN exhibition and device communication; Vercel cannot reach USB devices on a venue computer.

### Current verified status (October 2026)

- Cloud sign-in, role-gated workspace, project/settings persistence, database-backed reports, judging inserts, cloud file storage, and permission-filtered resource search are implemented.
- New accounts start as viewers. An operator must promote the first administrator in Supabase SQL Editor before staff can use the workspace.
- Public project routes read published, non-archived Supabase rows in cloud mode. Production starts with an empty project set; sample fixtures are not seeded as real data.
- Hardware telemetry still requires the local FastAPI agent and a physical Arduino/RFID device. Cloud deployment cannot access USB/serial hardware. Cloud display pairing uses expiring tokens and polling; deployed phone/display E2E verification remains pending.
- Production behavior is not fully validated until a real user is provisioned, Supabase Auth redirect URLs are configured, and deployed workflows are exercised.

## 📸 Live deployment preview

The following preview is captured from the public Vercel deployment. It may refresh as the deployment changes.

[Open CIRCUX OS in your browser](https://circux-os.vercel.app/)

![CIRCUX OS live deployment screenshot](https://image.thum.io/get/width/1200/crop/900/noanimate/https://circux-os.vercel.app/)

> Mobile UI note: saved project readings are labelled as reference data. Live telemetry and physical controls stay unavailable until a verified hardware adapter is configured. A global project search is available from the workspace header.

## 📚 Operations and documentation

| Guide | Purpose |
| --- | --- |
| [User and Administrator Guide](docs/USER_AND_ADMIN_GUIDE.md) | Roles, sign-in, projects, global search, uploads, judging, display pairing and local hardware |
| [Deployment, Recovery and Rollback Runbook](docs/DEPLOYMENT_RECOVERY_AND_ROLLBACK.md) | Release procedure, Vercel rollback, Supabase recovery and incident response |
| [Production Completion Checklist](docs/PRODUCTION_COMPLETION_CHECKLIST.md) | Evidence-based release gates and outstanding validation |
| [Release Record — 30 October 2026](docs/RELEASE_2026-10-30.md) | Deployment and CI history |

### Live deployment screenshot

The image below is a live-rendered preview of the production URL (not a manually captured browser test or proof of authenticated workflows). Refresh the README to view the current deployment.

![Circux OS production website preview](https://image.thum.io/get/width/1440/crop/1000/noanimate/https://circux-os.vercel.app/)

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
| Cloud database, auth, storage | Supabase PostgreSQL, Auth, Storage (RLS enabled) |

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

For Board Health, Arduino CLI, and serial telemetry, install Python dependencies with `python -m pip install -r backend/requirements.txt` and run `npm run backend` in a separate terminal. `RUN-CIRCUX.bat` starts both services plus the local frontend/relay.

Open the display at **http://localhost:3000/display**. For phone pairing, use the host computer's LAN IP address instead of `localhost`, and connect both devices to the same trusted Wi-Fi network.

For Windows, the repository also includes `RUN-CIRCUX.bat`. See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and [HARDWARE.md](HARDWARE.md) for additional setup and integration details.

## ◈ Feature Status

| Capability | Current status |
| --- | --- |
| Project workspace and showcase | Supabase-backed in cloud mode; local relay mode remains available |
| QR project pages | Public Supabase project reads in cloud mode; local mode uses local/relay records |
| Reports and settings | Project reports and event settings persist in PostgreSQL; theme preference persists per account |
| Judging | Authenticated records persist in PostgreSQL; role policies restrict reads/writes and validate scoring limits |
| Uploads | Private Supabase Storage bucket, 10 MB cap, database metadata; local mode uses relay files |
| Universal search | Authenticated RPC searches projects, members, documentation, judging, and display names under RLS |
| Sensor telemetry | No fabricated live readings; physical board validation remains outstanding |
| Hardware agent | Local FastAPI provides authenticated board registration, Arduino CLI detect/compile/upload, readiness checks, and validated serial JSON telemetry; no physical board has been confirmed in this workspace |
| Display pairing | Local relay/SSE and Supabase cloud pairing are implemented; deployed phone/display E2E is pending |
| First administrator | Requires explicit operator promotion after signup; no default password is created |

## 🔐 Security & Data Notes

See [SECURITY.md](SECURITY.md) for safe deployment guidance and vulnerability reporting.

- The local relay persists projects, settings, judging, and upload metadata in `.circux-data/store.json`; upload bytes are stored under `.circux-data/uploads`.
- Project external links are saved with project records; uploaded files are organized in per-project folders.
- Display pairing sessions remain in memory and expire after the configured inactivity timeout.
- Browser-local storage is an offline fallback and does not synchronize between browsers without the relay.
- Vercel requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and a redeployment after env changes. Never put a service-role key in a `NEXT_PUBLIC_` variable.
- Supabase project URL: `https://pluvaeplyqvwoctnxowc.supabase.co`. Auth redirect allow-list must include `https://circux-os.vercel.app/**` and local development URLs.
- Apply versioned schema changes from `supabase/migrations/` before deploying code that depends on them.
- Keep device keys and admin tokens private. Do not commit secrets to the repository.

## 🚀 Production-readiness checklist

See the detailed [production completion checklist](docs/PRODUCTION_COMPLETION_CHECKLIST.md) for the release gate and required cloud, search, upload, judging, display, and hardware verification.

Before using this with real students, judges, or devices:

- [x] Provision PostgreSQL, Auth, storage, RLS policies, and versioned schema migrations.
- [x] Add sign-in, role checks, database-enforced permissions, score constraints, and mutation audit events.
- [x] Configure public Supabase URL and publishable key in Vercel; production-flow verification remains pending.
- [ ] Promote the first admin and configure Supabase Auth redirects and email confirmation.
- [ ] Verify backups and perform a restore drill; configure uploaded-file retention.
- [ ] Use HTTPS/WSS for all remote device and relay traffic; avoid exposing admin tokens in URLs.
- [ ] Run end-to-end tests on mobile and desktop against the deployed environment.
- [ ] Test upload limits, recovery, rate limiting, and backup/restore procedures.
- [ ] Validate every hardware command with a physical interlock and fail-safe state.

CI verifies type checking, relay smoke/security tests, search coverage, production build, and Python backend tests. Passing CI does not prove account provisioning, deployed end-to-end flows, or physical hardware.

## Functional mode update (October 2026)

The workspace now loads and syncs project/config records through the local relay, supports selecting a project in Showcase, Documentation, and Judging, and displays actual relay/device availability. The relay no longer emits synthetic sensor readings. Reference values in starter project records are not live telemetry.

The Projects page includes edit, hide/show, and delete actions. Settings includes light/dark theme controls. Missing project details remain empty instead of borrowing readings from another project. The loading screen shows the Circux and sidya.v05 logos, and the site credits sidya.v05 and Yeshwanthkumardomala.

For Windows, `RUN-CIRCUX.bat` creates a random `CIRCUX_ADMIN_TOKEN` when one is not configured, saves it in the ignored `.env` file, and prints it in the launch terminal. In the admin Settings page, paste it once into **Local backend access** and save it to this browser; it can then be revealed or copied there and is also used by Board Health. The frontend cannot read `.env` automatically. This admin token is different from each board/device token. The local FastAPI docs are at `http://localhost:8000/docs` while the backend is running.

To point a local browser build at a relay reachable by its users, set `NEXT_PUBLIC_CIRCUX_RELAY_URL` at build time and allow the frontend origin in `CIRCUX_ALLOWED_ORIGIN`. Do not point the public Vercel site at a private LAN address.

## 🧭 Roadmap

- [x] Persistent project and judging storage foundation
- [x] Authentication and role-based access foundation
- [ ] Complete secure hardware-agent integrations and physical validation
- [ ] Automated tests for pairing, projects, and judging
- [x] Report and export workflows

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome. Please open an issue to discuss significant changes before submitting a pull request.

## 📄 License

Check the repository for a license file before reusing or redistributing this project.

---

<div align="center">

**CIRCUX OS** · Explore. Build. Demonstrate. Innovate.

<sub>Built for connected STEM and robotics experiences.</sub>

</div>

## Cloud onboarding

The initial administrator for the current deployment is provisioned. Sign in with that account; new registrations remain viewers until an administrator changes their role. Roles are assigned by the database, not selected in the login form.

1. Open `https://circux-os.vercel.app/` and sign in, or create an account. Confirm your email if Supabase Auth requires it.
2. For a fresh Supabase project only, promote the account you control (replace the email):

   ```sql
   update public.profiles p set role = 'admin'
   from auth.users u where p.id = u.id and lower(u.email) = lower('YOUR-EMAIL');
   ```

3. Sign in again, then create projects in the workspace. Role editing is not available to public users.
4. `CIRCUX_ADMIN_TOKEN` is only for the local FastAPI/relay. It is not a Supabase login token and must not be placed in a public Vercel variable.

### Local cloud development

Copy `.env.example` to `.env`, set the two `NEXT_PUBLIC_SUPABASE_*` values, then run `npm ci` and `npm run dev`. Leave `NEXT_PUBLIC_CIRCUX_LOCAL_MODE` unset for cloud-auth behavior. Use `NEXT_PUBLIC_CIRCUX_LOCAL_MODE=true` only for local UI work without cloud authentication; it is not production authentication.

### Remaining production checks

- Configure Supabase Auth redirect URLs and email confirmation for the Vercel domain.
- Verify backups and run a restore drill; configure uploaded-file retention.
- Add structured backend monitoring/log retention and verify the FastAPI readiness endpoint at the venue.
- Verify Arduino CLI against physical boards; add reader-specific RFID firmware/protocol support and test disconnect/safe-state behavior.
- Run cloud end-to-end tests for signup, roles, project CRUD, reports, files, judging, and public QR pages.

Run `npm run typecheck`, `npm run test:search`, `npm run test:uploads`, `npm run test:relay`, and `python -m unittest discover -s backend -p 'test_*.py' -v`. Passing CI does not prove the deployed or physical-hardware flows.
