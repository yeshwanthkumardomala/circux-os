# Circux OS production completion checklist

**Production URL:** https://circux-os.vercel.app/  
**Last documentation update:** 30 October 2026

This checklist distinguishes source/CI verification from live operational checks. A green build does not prove that real user accounts, private data permissions, deployed browser workflows, backups or physical hardware have been tested.

## Verified implementation and release evidence

- [x] Overview hardware badge reflects adapter state rather than a hard-coded status.
- [x] Local relay administrator-token panel is restricted to the admin role.
- [x] Judging panel handles an empty active-project state.
- [x] Shared global project search and route-level coverage regression test are present.
- [x] CI run #66 passed dependency installation/audit, search coverage, relay smoke test, upload policy regression, Next.js production build, TypeScript, Python syntax and backend security tests.
- [x] Production deployment for release commit `bb4dfc0530895ed2c56f42270d8056e03d0fbea4` reached Ready.
- [x] Follow-up documentation deployment for commit `7477fab51d81934279ed3ca57a8bb702bf1ce838` reached Ready and has the `circux-os.vercel.app` alias.
- [x] README includes a live-rendered production preview and links to the user/admin guide, recovery runbook, release record and this checklist.
- [x] User and administrator guide created: [USER_AND_ADMIN_GUIDE.md](USER_AND_ADMIN_GUIDE.md).
- [x] Deployment recovery and rollback runbook created: [DEPLOYMENT_RECOVERY_AND_ROLLBACK.md](DEPLOYMENT_RECOVERY_AND_ROLLBACK.md).

## Production operations — requires real account or dashboard access

### Authentication and role verification

- [ ] Verify Supabase Auth Site URL and production Redirect URL allow-list.
- [ ] Verify email confirmation delivery, link expiry, callback and sign-in on the deployed domain.
- [ ] Provision separate admin, instructor, judge and viewer test accounts.
- [ ] Confirm new registrations default to viewer.
- [ ] Test admin/instructor/judge/viewer permissions using actual sessions.
- [ ] Confirm session refresh after role changes and test sign-out/password recovery.
- [ ] Enable leaked-password protection in Supabase Auth password security settings.

**Why these remain open:** connector access can inspect project schema/advisors but does not provide test-account passwords, mailbox access or a browser session authenticated as each role. Dashboard Auth settings must be confirmed by an authorized project operator.

### Supabase RLS and security

- [ ] Test cross-user and cross-role access to projects, members, documents, uploads, judging, hardware and display records using direct API requests as each role.
- [ ] Confirm no service-role key or relay admin token is exposed in browser bundles, URLs, logs or public environment variables.
- [ ] Review GraphQL exposure findings and confirm intended public project reads are not broadened to private records.
- [ ] Review SECURITY DEFINER functions and their execute grants. Display pairing RPCs intentionally accept an expiring hashed pairing token; preserve that token check while validating scope and rate limits.
- [ ] Review multiple permissive RLS policies for overlapping behavior and performance.
- [ ] Re-run Supabase security and performance advisors after approved remediation.

**Current advisor findings (30 October 2026):** public GraphQL visibility for `public.projects`; authenticated GraphQL visibility for application tables; public/authenticated execute access to the display pairing RPCs; authenticated execute access to the admin role-management RPC; leaked-password protection disabled; multiple permissive policy warnings; unused-index informational notices. These findings require contextual review. Do not blindly revoke public project read or display pairing access because the application currently uses public published-project reads and token-authorized display pairing. Do not drop indexes solely because a low-volume production database has not used them yet.

### Projects and global search

- [ ] Create, edit, hide, publish, archive and reopen a project; verify persistence after refresh and a second browser session.
- [ ] Verify report sections, team/member details, links and reference readings persist.
- [ ] Search projects, participants, documentation, judging records and exhibition/display records with exact and partial terms.
- [ ] Verify search result navigation and authorization for every role.
- [ ] Test empty results, malformed input, network failure and retry behavior.

**Existing evidence:** source-level global search coverage regression test passed in CI. It is not a populated-data or per-role live search test.

### Files and judging

- [ ] Upload, download and delete allowed file types; verify 10 MB limit and unsupported-extension rejection.
- [ ] Verify storage object cleanup when metadata insertion or deletion fails.
- [ ] Verify judge score bounds, required fields, role permissions and duplicate-submit behavior.
- [ ] Verify judging records and exported totals against seeded test evaluations.
- [ ] Configure file retention and test recovery of both Storage objects and database metadata.

### Display mode

- [ ] Pair a phone with the deployed display.
- [ ] Verify slot A/B selection, swap, clear and refresh synchronization.
- [ ] Verify pairing-token expiry and rejected expired-token operations.
- [ ] Verify reconnect behavior after network interruption and browser reload.
- [ ] Verify display only reveals published, non-archived project content.

### Production reliability and backups

- [ ] Confirm Supabase Auth redirect and email settings.
- [ ] Verify database backup schedule and latest successful backup in Supabase dashboard.
- [ ] Complete a restore drill in a non-production environment.
- [ ] Confirm Storage object backup/retention independently from database backups.
- [ ] Verify monitoring, log retention, error alerts and incident ownership.
- [ ] Complete desktop/mobile authenticated E2E testing.

## Documentation and release

- [x] Production completion checklist.
- [x] Release record.
- [x] README production preview and documentation links.
- [x] User and administrator guide.
- [x] Deployment recovery and rollback runbook.
- [ ] Attach a dated, manually captured screenshot of an authenticated production workspace and a public project page. The README currently uses a live-rendered thumbnail, not a manually captured test artifact.
- [ ] Record signed-off test evidence and release owner after all live checks.

## Release gate

Do not describe Circux OS as fully production-validated until the remaining applicable account, RLS, deployed E2E, backup/restore and physical hardware checks have evidence. Vercel deployment Ready means the build was deployed; it does not prove that every feature works for every role or that a physical board was tested.
