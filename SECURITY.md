# Security Policy

## Scope

Circux OS is currently a local-first STEM exhibition prototype. It includes a browser frontend, a FastAPI backend, and a Node.js relay. These services have different authentication and persistence behavior; do not assume that protecting one service protects the others.

## Safe deployment

- Run the exhibition services only on a trusted private network.
- Do not expose the Node relay or FastAPI ports directly to the public internet.
- Use long, unique values for `CIRCUX_ADMIN_TOKEN` and `CIRCUX_DEVICE_KEY`; keep them outside source control.
- Do not treat CORS as authentication. Non-browser clients can call HTTP endpoints directly.
- Use the FastAPI admin token only where that API's authorization is enforced. Review relay routes separately before using the system with untrusted clients.
- Keep hardware adapters in sensor-only mode until command authorization, physical safety interlocks, and failure behavior have been tested.
- Back up `.circux-data` securely and restrict access to stored uploads and local database files.
- Rotate any credential that may have been exposed.

## Reporting a vulnerability

Please do not publish credentials, private network details, or a working exploit in a public issue. Use GitHub's private vulnerability reporting or contact the repository owner privately through GitHub to report security concerns.

Include the affected component, impact, reproduction steps, and any mitigations you have already tried. Do not include real student data or secrets.

## Current limitations

The project is a prototype and should not be considered production-hardened. In particular, the Node relay and FastAPI backend must be reviewed independently, and persistent storage, access control, deployment isolation, and hardware command authorization need validation before use beyond a trusted local exhibition network.
