In-app participant ordering — 10 November 2026
Participant ordering now runs in KAMUN at /coffee through the authenticated ecg-coffee bridge and ECE private participant API. Existing ECE staff tools, database, cookie API and legacy handoff remain intact.
Source branch: astra/kamun-inapp-coffee. Portable patch: in-app-ordering.patch.
See docs/IN_APP_COFFEE.txt in the KAMUN workspace for data flow, validation and rollback.

Current target — 8 November 2026
Participant/API: https://kamun-ece-cafe.pages.dev
Staff/admin: https://kamun-ece-covfefe.pages.dev
Use the production KAMUN_INTEGRATION_KEY, paired with Supabase ECG_INTEGRATION_KEY.
See docs/ECG_SHARED_CODE_RELEASE.txt for callback and deployment requirements.
The Atelier projects were deleted. Do not deploy to or recreate them.
The patch is a historical source artifact, not production deployment configuration.

Source artifacts
- single-login.patch preserves the shared-login integration and linked-session
  migrations for reference; in-app-ordering.patch adds the participant API.
- Apply patches only to their matching base revision after git apply --check.
  The current ECE checkout is authoritative; patches are not deployment configs.
- ECE source: https://github.com/karan-kc/covfefe. Deployment and source uploads
  remain separate operations. Never reset/import the current production roster.
