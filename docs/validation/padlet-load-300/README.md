# Padlet 300-user local concurrency test — 11 November 2026

This test runs product migrations and RPC functions in a disposable PostgreSQL 17 Docker container, with 300 independent authenticated database sessions and distinct seeded ECG delegates. Each session has an eight-second statement timeout. PostgreSQL is configured with 350 maximum connections and 128 MiB shared buffers. The Docker VM has 8 CPUs and approximately 7.65 GiB RAM; the container has no additional CPU/memory cap.

Auth and Storage schemas are minimal fixtures. Identity bindings, membership/access checks, row-level security, upload reservations, posting functions, vote functions, comment functions, and limits use repository migrations. `migrations.json` identifies the exact migration subset needed for these features; `results.json` records their SHA-256 hashes and PostgreSQL version. Unrelated content migrations are omitted.

No production requests, accounts, posts, images, votes, comments, settings or deployments were changed.

## Results

| Scenario | Accepted / expected rejections | p95 local latency |
| --- | --- | --- |
| 300 simultaneous reserve / Storage metadata insert / post flows | 300 / 0 | 526 ms |
| 300 upvotes on one post | 300 / 0 | 285 ms |
| 300 vote switches on one post | 300 / 0 | 188 ms |
| 300 comments competing for the 200-comment post cap | 200 / 100 | 285 ms |
| 299 distributed comments plus one intentionally full post | 299 / 1 | 67 ms |
| 299 own comment removals alongside one thread read | 300 / 0 | 47 ms |
| 300 readers at 2-second intervals for 15 cycles, with 300 vote writes each cycle | 4500 refreshes; 4500 vote writes | 653 ms per refresh |
| Extreme: 300 viewers each refresh 24 open comment threads plus gallery/totals and vote, five 2-second ticks | 1500 refreshes; 1500 vote writes | 1471 ms per refresh |
| 300 upload reservations compete for the last 10 bucket slots | 10 / 290 | 52 ms |

All assertions passed; zero unexpected errors. Both polling scenarios kept their synchronized schedule. The extreme case recorded zero refreshes over two seconds (maximum 1,514 ms). These measurements apply only to this local test environment.

## Scope and limits

This establishes local database concurrency correctness and measures local latency. It does **not** establish a production-safe maximum or simulate 300 complete mobile/browser clients. Uploads exercise reservation, Storage metadata insertion under authenticated RLS, and post creation; **no image bytes are transferred**. The test excludes hosted Supabase Auth/JWT validation, PostgREST, Storage API/file throughput, signed image URL generation, network latency, provider quotas, front-end rendering, and background/resume behavior. Actual multi-megabyte uploads from 300 users still need a disposable hosted staging test.

The normal polling scenario runs 15 synchronized ticks, targeting two-second intervals, with 300 viewers each reading a 24-post gallery, its moderation permission, one batch of 24 activity totals, and one open comment thread. Every viewer also writes one vote per tick. Each session executes queries sequentially while all 300 sessions run concurrently. This approximates the database RPC workload; it does not invoke the React polling hook itself or measure the frontend request-coalescing implementation.

The extreme scenario runs five two-second ticks with every viewer reading 24 open comment threads, plus gallery, permissions, activity totals, and a vote. A tick waits for all viewers to complete; schedule lag and refreshes exceeding two seconds are recorded. The test does not create an unbounded request backlog if the workload takes longer than the interval.

Expected capacity rejections count as correct behavior, not unexpected errors: posts permit at most 200 comments, and the bucket permits 2,000 upload reservations. The final capacity scenario seeds the bucket counter to 1,990 and checks that only ten of 300 simultaneous reservations succeed. It uses synthetic accounting to reach the limit without creating 1,990 objects.

## Reproduce

Requires Docker, Node.js, and the `pg` driver. Run from the repository root, against a fresh disposable database:

```sh
npm install --prefix /tmp/kamun-padlet-load-300 pg --no-audit --no-fund
docker run --name kamun-padlet-load-300 --detach --env POSTGRES_PASSWORD=local-load-only --env POSTGRES_DB=padlet_load --publish 127.0.0.1:55439:5432 postgres:17 -c max_connections=350 -c shared_buffers=128MB
node docs/validation/padlet-load-300/load.mjs
docker stop kamun-padlet-load-300
```

The harness is hardcoded to localhost:55439 and the disposable `padlet_load` database. Setup requires an empty database; it fails if the fixture schemas already exist and does not erase an existing database. To rerun, explicitly recreate only this disposable database or use a new container. `PADLET_LOAD_DRIVER` may point to another `package.json` whose installation contains `pg`.

## Artifacts

- `load.mjs`: executable concurrency harness with assertions.
- `bootstrap.sql`: minimal platform Auth/Storage fixtures.
- `migrations.json`: product migration manifest.
- `results.json`: measured results from the final run.
