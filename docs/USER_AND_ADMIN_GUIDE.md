# Circux OS — User and Administrator Guide

Production: https://circux-os.vercel.app/

## Roles

| Role | Intended access |
|---|---|
| Admin | Workspace administration, project management, judging oversight and local backend credential panel |
| Instructor | Project and learning-workspace operations and exhibition preparation |
| Judge | Evaluation workflow and permitted project information |
| Viewer | Read-only published workspace content |

New Supabase registrations receive the `viewer` role through the database trigger. An existing administrator must promote staff accounts. Authorization must use the database profile role, not editable user metadata.

## First administrator provisioning

1. In Supabase Authentication → Users, identify the intended account and copy its UUID.
2. In SQL Editor, update only the verified account:

```sql
update public.profiles set role = 'admin' where id = '<verified-auth-user-uuid>';
```

3. Confirm exactly one row was updated. Do not publish the UUID or credentials.
4. Sign out and sign in again to refresh role-dependent UI.
5. Create separate instructor, judge and viewer accounts for acceptance testing. Do not share the admin login.

The `public.admin_set_circux_role(uuid,text)` RPC is available to an existing admin to change another user's role. It rejects self-role changes.

## Sign-in and account security

- Use the production URL over HTTPS and complete email confirmation if enabled.
- If confirmation redirects to an error or localhost, check Supabase Auth Site URL and Redirect URLs. Allow `https://circux-os.vercel.app/**` and only approved local development URLs.
- Never share passwords, access tokens, service-role keys or local relay tokens.
- Enable leaked-password protection in Supabase Auth password security settings.

## Workspace and projects

1. Open the workspace and select or create a project (staff roles only).
2. Maintain its stable ID, title, category, status, summary, team details and project data.
3. Save edits and wait for the success/error response.
4. Use publish/hide controls to manage public showcase visibility; archive projects no longer active.
5. Refresh and verify persistence in a second browser session.

## Global search

Use the shared workspace search for projects, participants, project documentation, judging records and exhibition/display records. Test exact and partial terms. Search must respect role permissions. A result must not disclose private records to viewers or unrelated users.

## Documentation and files

- Open the correct project before editing report sections.
- Upload supported file types within the configured 10 MB limit.
- Verify the upload appears against the intended project; download it to confirm readability.
- Delete obsolete files through the application and verify object and metadata cleanup.
- Storage is private by default. Public access should be limited to files intentionally associated with a published project and allowed by storage policies.

## Judging

Select the project, score the five criteria within their limits, add feedback and submit once. Criteria: Innovation 25, Technical implementation 25, Problem relevance 20, Presentation 15, Social/environmental impact 15. Confirm the saved record appears and reconcile exported totals. The database validates the five numeric score values and their limits.

## Exhibition display and QR

Public QR/project pages show only published, non-archived projects. Staff create a display pairing and use its generated time-limited token on the intended display. Test slot A/B selection, swap, clear, refresh, expiry and re-pairing before an event. Keep pairing tokens private.

## Local hardware and Arduino

Vercel cannot access a USB-connected Arduino directly. Run the local Circux relay and FastAPI agent on the trusted host computer.

1. Configure a strong `CIRCUX_ADMIN_TOKEN` in the repository-root `.env`.
2. Install Node.js, Python dependencies and Arduino CLI as described in `HARDWARE.md`.
3. Start the local relay and backend using the repository launcher or npm scripts.
4. In the admin workspace, open Settings → Local backend access and enter the token.
5. Connect the Arduino Uno and RFID reader; verify board/port detection before compiling or uploading.
6. Test serial output and RFID reads with a non-critical test sketch.
7. Disconnect/reconnect and verify the UI reports loss and recovery.
8. Stop outputs and disconnect power before rewiring motors, relays or high-current loads.

Never expose the relay token to viewers/judges or put it in URLs, Git commits, QR codes or screenshots.

## Troubleshooting

| Symptom | Check |
|---|---|
| Sign-in redirect error | Supabase Site URL, Redirect URLs, confirmation state and production origin |
| Account sees viewer UI | `public.profiles.role`; sign out/in after role change |
| Search returns nothing | Saved record, role permissions, exact/partial query and search RPC |
| Project edits disappear | Save response, Supabase connection, RLS and browser console |
| Upload fails | File type, 10 MB limit, storage bucket and staff role |
| Judging fails | Judge/staff role, selected project, score limits and database response |
| Display stops updating | Token expiry, network, pairing status and publication state |
| Arduino not detected | Data-capable USB cable, driver, port, Arduino CLI and local agent |

## Role-based acceptance test

Use separate test accounts and disposable test projects. Verify denied operations at the backend, not only by hidden UI controls.

- [ ] Admin can perform staff operations and see local backend settings.
- [ ] Instructor can perform intended project/exhibition operations but cannot administer roles unless explicitly authorized.
- [ ] Judge can submit permitted evaluations but cannot edit project configuration or roles.
- [ ] Viewer can read published content and cannot mutate projects, upload, judge or administer.
- [ ] A user cannot read or modify another user's private records by changing an ID or calling an API directly.
- [ ] Role changes take effect after session refresh.
