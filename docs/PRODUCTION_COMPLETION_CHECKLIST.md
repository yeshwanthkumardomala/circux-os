# Circux OS production completion checklist

This checklist separates repository-level implementation from checks that require a real account, deployed browser session, or physical hardware. A green build alone does not mark the latter complete.

## Changes in this patch

- [x] Show the actual hardware adapter state on the Overview page instead of a permanently hard-coded "hardware not configured" badge.
- [x] Restrict the local relay administrator-token panel to the `admin` role. Instructor and viewer accounts must not be shown the local machine's shared relay secret.
- [x] Keep the global project search in the shared workspace header and retain the route-level search coverage test.

## Required verification before public use

### Cloud account and permissions
- [ ] Sign in with the intended administrator account on the production URL.
- [ ] Confirm Supabase Auth redirect URLs and email-confirmation behavior.
- [ ] Confirm new registrations receive the viewer role.
- [ ] Verify admin, instructor, judge, and viewer permissions against real accounts.
- [ ] Verify RLS prevents cross-user or unauthorized project, report, upload, judging, and display access.
- [ ] Confirm no service-role key or relay admin token is exposed in client bundles, URLs, logs, or public environment variables.

### Project and search workflows
- [ ] Create, edit, hide, publish, archive, and reopen a project; verify persistence after refresh and a second browser session.
- [ ] Verify report sections, team/member details, links, and reference readings persist.
- [ ] Search projects, participants, documentation, judging records, and exhibition/display records using both exact and partial terms.
- [ ] Verify search result navigation and permissions for each role, including empty and failed-search states.

### Files and judging
- [ ] Upload, download, and delete each allowed file type; verify the 10 MB limit and rejection of unsupported extensions.
- [ ] Verify storage object cleanup if metadata insertion or deletion fails.
- [ ] Verify judging score bounds, required fields, role permissions, and export totals.
- [ ] Configure upload retention and test a recovery/restore procedure.

### Display and hardware
- [ ] Pair a phone with a deployed display and verify token expiry, reconnect, and synchronization.
- [ ] Test local relay connectivity from a second device on the exhibition LAN.
- [ ] Connect a physical Arduino Uno and RFID reader; verify Arduino CLI detection, compile/upload, serial data, disconnect recovery, and safe-state behavior.
- [ ] Confirm Vercel never claims direct access to venue USB/serial hardware; use the local FastAPI agent for those operations.

### Release operations
- [ ] Run `npm ci`, `npm run typecheck`, `npm run test:search`, `npm run test:uploads`, `npm run test:relay`, `python -m unittest discover -s backend -p 'test_*.py' -v`, and `npm run build`.
- [ ] Run desktop and mobile end-to-end tests against the deployed environment.
- [ ] Verify Supabase backups and complete a restore drill.
- [ ] Confirm monitoring, log retention, error alerts, and incident/recovery ownership.
- [ ] Review keyboard navigation, screen-reader labels, contrast, and responsive layouts.

## Release gate

Do not describe Circux OS as fully production-validated until all applicable cloud, deployed-browser, backup/restore, and physical-hardware checks above have evidence. The Overview hardware badge is an adapter status indicator, not proof that a specific board or RFID reader has been physically tested.
