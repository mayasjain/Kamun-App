Current update — 4 November 2026
The portable patch now targets base e3f6b50d09c2cbe2bcbaf300ee598a962eb7638f and includes shared login plus the requested participant back arrow. It has been deployed to ece-atelier-cafe and ece-atelier-staff in the owner’s Cloudflare account. The working branch is astra/atelier-shared-login in /private/tmp/kamun-ece-deploy. No GitHub push has been made. The earlier branch/commit details below are historical.

ECE changes for KAMUN shared login

Repository: https://github.com/karan-kc/covfefe
Local branch: astra/kamun-single-login
Commit: 8d8638c
Status: NOT PUSHED. Automatic approval review requires explicit authorization to upload source to the repository above.
Base: a59a9af95a4dd292abed9b7d57bcec66d8754dbf

The patch restores the previously reverted verification/handoff integration and adds linked-session logout. It contains source, additive D1 migrations and tests; no secrets, real participant codes, database exports or dependencies.

The local branch is in /private/tmp/kamun-ece-integration. The patch below is the durable deliverable in this workspace. Once authorized and pushed, review the new branch in the ECE repository.
Alternative: on a clean checkout at the base commit, run:
  git apply --check /path/to/single-login.patch
  git apply /path/to/single-login.patch
  npm ci
  npm run typecheck
  npm test -- --maxWorkers=2
  npm run build

Deployment needs the ECE owner's Cloudflare account and matched private secrets on ECE and Supabase. Follow docs/ECG_SHARED_CODE_RELEASE.txt in KAMUN for the paired staging and deployment sequence. Do not run provision:demo or reset/import the current roster.
