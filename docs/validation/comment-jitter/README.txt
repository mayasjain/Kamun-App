Comment typing stability — 14 November 2026

Changes:
- Meme photo layout uses width/aspect ratio rather than changing window height,
  so opening a mobile keyboard cannot shrink all cards and move the scroll position.
- Background gallery changes and signed-image refreshes are deferred while an
  open comment composer is focused or has an unsent draft. In-flight gallery
  responses are checked again before application. Closing a thread or unmounting
  releases its guard; no unsent text is discarded by this mechanism.
- Thread polls keep vote totals live but do not replace the comment list while
  composing. Focus/draft changes invalidate in-flight thread responses.
- The input has a stable height and its Cancel/Comment row is always present,
  avoiding first-character layout insertion. Unchanged totals preserve gallery
  state rather than causing another parent render for every visible card.

Validation:
- Mobile typecheck, lint, all 56 regular tests and web export pass.
- Two component regression tests pass using React 19.2.3/test-renderer in a
  temporary installation; no application dependency changes are required.
- Tests render the actual discussion component with mocked native primitives
  and services, then exercise focus, typing, polling, an in-flight response,
  blur, cancel, collapse/reopen, retained drafts, and unmount cleanup.
- An actual MemePhoto render keeps identical layout props when a simulated
  window changes from 844px to 400px high, as when a keyboard opens.
- These renderer tests do not measure real browser/native keyboard animations,
  scrolling or device frame timing. A real-device visual check remains useful.

Rerun component regressions:
npm install --prefix /tmp/kamun-comment-jitter react@19.2.3 react-test-renderer@19.2.3 --no-audit --no-fund
node --test docs/validation/comment-jitter/composer.test.mjs

COMMENT_RENDERER can point to another temporary package.json with these packages.
