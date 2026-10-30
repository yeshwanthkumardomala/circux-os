# Circux OS — Deployment, Recovery and Rollback Runbook

**Production:** https://circux-os.vercel.app/  
**Vercel project:** `circux-os`  
**Git production branch:** `main`  
**Cloud database:** Supabase project `pluvaeplyqvwoctnxowc`

This runbook is an operational procedure. Confirm the current dashboard UI and deployment identifiers before acting; identifiers in historical release records are not necessarily the latest release.

## 1. Normal release path

1. Work on a short-lived branch; do not commit directly to `main`.
2. Review the diff and check that no `.env`, tokens, private student data or service-role key is included.
3. Run:
   ```bash
   npm ci
   npm run typecheck
   npm run test:search
   npm run test:uploads
   npm run test:relay
   python -m unittest discover -s backend -p 'test_*.py' -v
   npm run build
   ```
4. Open a pull request to `main`, review the changed files and wait for all required CI jobs.
5. Apply any required Supabase migration in the intended project before deploying code that depends on it. Review SQL and data impact first; do not run destructive SQL casually.
6. Merge the reviewed pull request.
7. Wait for the Vercel production deployment to reach **Ready** and confirm the `circux-os.vercel.app` alias points to it.
8. Run smoke checks for the home page, sign-in route, workspace load and public project route. Then run authenticated role-specific acceptance tests.
9. Record the commit SHA, deployment ID, CI run, migration identifiers and test evidence in the release record.

## 2. Vercel deployment recovery

### Build or deployment failure

1. Open the Vercel project → Deployments and inspect the failed production deployment's build/runtime logs.
2. Identify whether the failure is source/build, missing environment variable, Supabase connectivity, runtime or alias assignment.
3. Correct the cause on a branch and run the full CI suite.
4. Deploy through the normal Git-connected production branch workflow.
5. Do not paste environment-variable values into issues or logs. Verify variable names and target environments without disclosing their values.

### Roll back application code

1. Identify the last known-good production deployment and verify its commit SHA and status.
2. In Vercel Deployments, use the platform's rollback/promote-to-production action for that known-good deployment.
3. Confirm the production alias is assigned to the intended deployment.
4. Smoke-test sign-in, read-only project display and one permitted staff workflow.
5. Create a follow-up fix on a branch. A rollback is a temporary recovery measure, not a substitute for fixing the faulty commit.

**Important:** Rolling back frontend code does not reverse database migrations, uploaded objects, user changes or other external side effects. Never assume an application rollback restores the database.

## 3. Supabase recovery

- Keep database backups enabled according to the subscription/retention policy and verify the latest successful backup in the Supabase dashboard.
- Before a risky schema or data migration, record the current migration state and arrange a recovery point.
- Prefer forward-fix migrations for additive schema changes.
- If a migration is destructive or data-transforming, test it against a non-production copy and document a tested reversal or restore procedure first.
- A point-in-time restore can replace database state and may discard writes made after the restore point. Obtain explicit operational approval, communicate downtime/data-loss implications, and follow the current Supabase dashboard restore workflow.
- After restore, verify schema/migration state, account access, project counts, role policies, storage metadata and application connectivity.
- Database backups and Storage object backups/retention are separate concerns. Confirm object recovery independently; do not assume a database restore restores uploaded file bytes.

## 4. Auth and access recovery

- Verify Supabase Auth Site URL and Redirect URLs against the production and explicitly approved development origins.
- If a staff account is locked out, use the Supabase Auth admin workflow to recover that account; do not create a shared generic administrator.
- New accounts default to `viewer`. Promote a verified account only after confirming its identity and UUID.
- If a credential may have leaked, revoke sessions/reset the affected account credentials and rotate the credential at its source.
- The local `CIRCUX_ADMIN_TOKEN` is independent of Supabase Auth. Rotate it on the local host by changing/removing it in the repository-root `.env`, restarting the local launcher, and replacing the saved value in Settings → Local backend access.

## 5. Local relay and hardware recovery

1. Stop the launcher and verify the Node relay/FastAPI processes have exited.
2. Preserve logs and the local data directory before changing files.
3. Check `.env` exists and contains the expected token key; never copy its value into tickets or source control.
4. Check Python dependencies, Node version, Arduino CLI installation and USB driver/port.
5. Restart the relay and backend, then verify their health endpoints and board discovery.
6. Re-enter the rotated token in the admin workspace if required.
7. Test with an LED/safe test sketch before reconnecting motors, relays or other loads.
8. Confirm outputs are in a safe state after a disconnect or failed command.

The local JSON store and upload directory are separate from Supabase. Back them up independently if local relay mode is used.

## 6. Incident checklist

- [ ] Record incident start time, affected environment, route and symptoms.
- [ ] Identify the last known-good deployment and current production commit.
- [ ] Preserve relevant logs without secrets or personal data.
- [ ] Determine whether the incident is code, database, Auth, storage, network or hardware.
- [ ] Stop unsafe hardware activity before troubleshooting.
- [ ] Choose rollback, forward fix or restore based on the affected layer.
- [ ] Verify public pages and each role after recovery.
- [ ] Verify uploads, judging and display pairing as applicable.
- [ ] Record root cause, data impact, recovery action and follow-up owner.

## 7. Recovery validation

A recovery is not complete until the following applicable checks pass:

- [ ] Production deployment is Ready and custom domain resolves to it.
- [ ] Sign-in, sign-out and password recovery work.
- [ ] Admin/instructor/judge/viewer authorization is correct.
- [ ] Projects and documentation load and persist.
- [ ] Search returns only records the current role is allowed to see.
- [ ] Upload download/delete behavior is correct.
- [ ] Judging submissions and exports are consistent.
- [ ] Display pairing expires and reconnects correctly.
- [ ] Local relay and hardware recover safely if used.
- [ ] Backup and storage recovery status is recorded.

## 8. Operational ownership

Assign a named human owner for production account provisioning, Supabase billing/backups, Vercel deployments, incident communications and physical hardware safety before using the platform at a public event. This runbook does not itself enable backups, change dashboard Auth settings or prove that a restore has been rehearsed.
