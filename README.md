<div align="center">

# ◈ CIRCUX OS

### The Operating Workspace for STEM & Robotics

**Build. Showcase. Evaluate.**

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

Designed for local exhibition workflows, Circux supports QR-based project access and phone-to-display pairing. It is a prototype in active development; some data and telemetry remain local or simulated.

## ✦ Core Features

| Feature | What it does |
| --- | --- |
| **Project Workspace** | Organize project details, teams, categories, status, and summaries. |
| **Project Documentation** | Present project stories, circuit information, media links, and report drafts. |
| **QR Project Access** | Open project details from scannable QR cards. |
| **Display Pairing** | Pair a phone with an exhibition display over a local network. |
| **Dual-Project Showcase** | Present two projects in Slot A and Slot B, with clear and swap controls. |
| **Judging Workflow** | Record and display project evaluation scores. |
| **Telemetry Demonstrations** | Display sample readings and status information for demonstrations. |

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

For the local app, exhibition relay, QR pairing, and demonstration feeds, run:

```bash
npm run exhibition
```

Open the display at **http://localhost:3000/display**. For phone pairing, use the host computer's LAN IP address instead of `localhost`, and connect both devices to the same trusted Wi-Fi network.

For Windows, the repository also includes `RUN-CIRCUX.bat`. See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) and [HARDWARE.md](HARDWARE.md) for additional setup and integration details.

## ◈ Feature Status

| Capability | Current status |
| --- | --- |
| Project workspace and showcase | Available in the prototype |
| QR project pages and display pairing | Available in the local exhibition workflow |
| Judging and browser-local settings | Prototype functionality |
| Sensor telemetry | Demonstration / simulated data |
| Persistent cloud database | Not connected |
| Production authentication | Not implemented |
| Direct hardware control | Requires a configured adapter and testing |

## 🔐 Security & Data Notes

See [SECURITY.md](SECURITY.md) for safe deployment guidance and vulnerability reporting.

- Project records, report drafts, settings, and judging data use browser-local storage.
- Exhibition relay state is held in memory and resets when the relay stops.
- Uploaded files are registered by name; this workflow does not upload their contents.
- Keep device keys and admin tokens private. Do not commit secrets to the repository.
- Use the relay only on a trusted network and configure hardware adapters before enabling device commands.

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
