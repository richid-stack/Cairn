# Cairn: backend plan (summary)

Full plan with diagrams: https://claude.ai/artifact/Qqe3g5PHkLNyntxPS3FA8J
Frontend plan: [frontend-plan.md](frontend-plan.md)
Decisions: [decisions.md](decisions.md)

This file is a summary kept in the repo. The full document in the Cairn project is the source of record and has the architecture and build-order drawings.

## Shape

- One TypeScript backend, PostgreSQL (with row-level security and pgvector), Redis, S3-compatible storage, and key management for connector tokens.
- Contract first: an OpenAPI spec and a streaming event schema live in the repo. A mock server answers every route until the real API catches up.
- Services: API, agent runtime, trust layer, workers, connector kit, wallet. Every tool call passes the trust layer before it runs.
- Stack choices are proposals, each with a point at which to revisit it. The payment provider depends on where the business is registered.

## Trust layer

Risk tiers 0 to 4: read only, reversible change, outward-facing, money or permanent loss, account-level. Approvals, permission rules, spending caps, a hash-chained audit log and undo recipes. The agent cannot spend anything until B8.

## Phases

Focused weeks for one person, 68 in total. The last column is the frontend phase that needs the API.

| Phase                              | Weeks | Done when                                                                                                        | Frontend |
| ---------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------- | -------- |
| B0 Foundations                     | 3     | A blank API deploys on every commit; mock and real API pass the same contract tests                              | 0        |
| B1 Identity and accounts           | 4     | A new user signs up, recovers access and signs out other devices; no route returns another user's data           | 3        |
| B2 Threads and streaming           | 5     | A stream survives a dropped connection with no lost or repeated text                                             | 4        |
| B3 Agent runtime                   | 8     | A scripted errand runs end to end, survives a worker restart, and the eval suite passes                          | 4, 5     |
| B4 Trust layer                     | 6     | No tool above tier 0 runs without the trust layer; every action is visible and undoable or labelled irreversible | 5        |
| B5 Connectors                      | 6     | Each connector shows connected, expired, error and revoked states; revoking deletes tokens at once               | 7        |
| B6 Memory and Soul                 | 4     | The user can see, edit and delete every memory; the agent's name and voice persist                               | 3, 5     |
| B7 Tasks, notes, schedules         | 5     | A scheduled run fires after a restart and queues its approvals                                                   | 6        |
| B8 Wallet and billing              | 6     | Daily reconciliation shows no gaps in staging; no purchase can pass a cap                                        | 7        |
| B9 Realtime and voice              | 5     | A call survives a network drop and resumes                                                                       | 8        |
| B10 Browser agent                  | 6     | A session cannot reach internal addresses and ends cleanly on take-over                                          | 5        |
| B11 Sharing, notifications, export | 4     | Export and delete tests pass for every entity                                                                    | 9        |
| B12 Hardening and launch           | 6     | Beta users finish core tasks; no high security finding is open                                                   | 12       |

## Build order for one person

Estimates, plus or minus 30 percent.

| Cut          | Includes                                                                                                        | Solo time                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Thin slice   | B0 to B3 plus one approval, with thin frontend phases 0 to 4                                                    | About 6 months                                                          |
| Private beta | B0 to B7 and a light B12, with frontend phases 0 to 5 and a light 6; no wallet, voice, browser agent or sharing | About 18 months                                                         |
| Full plan    | Every phase at full depth                                                                                       | About 31 to 36 months, or 20 to 24 with one extra engineer from month 6 |

## Quality gates (CI must pass to close a phase)

Strict types and lint; unit and integration tests against a real Postgres; contract tests; tenant-isolation tests on every route; agent evals with zero unsafe actions in the injection suite; API reads p95 under 300 ms excluding model calls; migration apply and rollback; dependency audit, secret scanning and an outside penetration test before beta; export and delete tests; a monthly backup restore drill.

## Security and privacy

Passkeys and email codes, envelope-encrypted connector tokens that no API returns, untrusted content treated as data, row-level security, idempotency keys and budgets against runaway spend, sandboxed browser sessions, no message content or tokens in logs. Payment and data-protection rules differ by country, so get qualified advice before B8 and before beta. These plans are not legal advice.
