## Context

The DHIS2 v42 Tracker Web API is [documented here](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-242/tracker.html). The four read surfaces in scope are:

| Endpoint                           | Library method           | File                                |
| ---------------------------------- | ------------------------ | ----------------------------------- |
| `GET /api/tracker/trackedEntities` | `TrackedEntities.get`    | `src/api/trackerTrackedEntities.ts` |
| `GET /api/tracker/enrollments`     | `TrackerEnrollments.get` | `src/api/trackerEnrollments.ts`     |
| `GET /api/tracker/events`          | `TrackerEvents.get`      | `src/api/trackerEvents.ts`          |
| `GET /api/tracker/events/{id}`     | `TrackerEvents.getById`  | `src/api/trackerEvents.ts`          |

The cross-check revealed three categories of drift (documented in `proposal.md`): runtime bugs, missing params, missing output fields. This design explains **why** we grouped them in one change, how we handle the param-name ambiguity in the v42 docs, and how we draw the line between "fix" and "deprecation shim".

## Goals

-   Produce requests v42 actually honors — specifically, the `attributeCategoryCombo` / `attributeCategoryOptions` / `followUp` fixes.
-   Let consumers reference every v42-documented request param through a typed field, no `as` escapes.
-   Let consumers destructure every v42-documented response field through a typed member, no `as` escapes.
-   Keep the change's blast radius inside `src/api/tracker{,TrackedEntities,Enrollments,Events}.ts` and their colocated tests.

## Decisions

### 1. BREAKING renames instead of deprecation aliases (for the three runtime bugs)

`attributeCc`/`attributeCos`/`followup` are not "old working names being replaced". They are **non-functional**: DHIS2 v42 never read them, so `.get({ attributeCc: "x" })` produced a query string v42 drops, and destructuring `event.followup` yielded `undefined`. Keeping a deprecation alias would preserve type surface for code that already doesn't work — the kindest break is a compile error at the call site.

The one exception is `programStatus` on enrollments, which DHIS2 **did** honor before v42 and still accepts as a backward-compatible alias server-side. Keep it typed, mark `@deprecated`, alongside the new `status`. Single-release deprecation window.

### 2. Plural/singular param ambiguity: accept both

v42 docs use plural in the collection-params table headers (`trackedEntities`, `events`, `enrollments`, `assignedUsers`) but the URL examples and the rules section use the singular (`trackedEntity=id1,id2`, `event=...`, `assignedUser=...`). Testing against real DHIS2 v42 shows both work.

Rather than picking one and making the library lie about the other, keep both typed. Current code already does this for `trackedEntities` vs `trackedEntity` on the TE endpoint — extend the same pattern to `event`/`events` and `assignedUser`/`assignedUsers` where asymmetric.

### 3. `orgUnit` vs `orgUnits` on the TE response

The v42 response sample shows `orgUnit: "<uid>"` — a single value. The current type `SemiColonDelimitedListOfUid` is wrong for the response shape. Tighten to `Id`.

On the **request** side, `orgUnits` (plural, CSV) is the documented param name and stays as-is.

### 4. `completedAt` / `completedBy` are optional

v42 only emits these fields for events/enrollments in `COMPLETED` status. Typing them as required would force consumers to null-check anyway, and any concrete status test would need two fixtures — mark them optional.

### 5. `TrackerEvents.getById` narrows params

The single-object endpoint `/tracker/events/{id}` only honors `fields`. The current type accepts the full collection-params object and silently sends params DHIS2 ignores. Narrowing is a **breaking change** — but it's also the fix:

```ts
getById<Fields extends D2TrackerEventFields>(
    id: string,
    params: { fields: Fields }
): D2ApiResponse<SelectedPick<D2TrackerEventSchema, Fields>>
```

The response type changes from raw `D2TrackerEvent` to `SelectedPick<…, Fields>` so the field selection types match `get`. Consumers currently getting the full object without specifying fields see no behavioral break — they just get a more precise type.

### 6. Testing posture — integration against `https://play.dhis2.org/42`

Tests in this change are **integration tests** that hit the public DHIS2 v42 play server at `https://play.dhis2.org/42` with the standard demo credentials (`admin` / `district`). The server is assumed to always be up — no mocking layer (`axios-mock-adapter`, `getMockApiFromClass`) is used for this change.

Rationale: the bugs in scope (`attributeCc/Cos`, `followup` typo, `getById` over-typing) are precisely the kind a mock can't catch — a mock would faithfully "ignore" the wrong param name just like the server does. Hitting the real v42 server proves the rename actually produces filtered results and that `event.followUp` decodes a real payload.

Structure:

-   One `*.integration.test.ts` file per endpoint, colocated next to the client:
    -   `src/api/trackerTrackedEntities.integration.test.ts`
    -   `src/api/trackerEnrollments.integration.test.ts`
    -   `src/api/trackerEvents.integration.test.ts`
-   Each file bootstraps a single `D2Api` against `https://play.dhis2.org/42` via a shared helper `getPlayD2Api()` (added in `src/testing.ts`). Auth: `{ username: "admin", password: "district" }`. Base URL: `https://play.dhis2.org/42`.
-   Test assertions target behavior that is **stable** on the play demo dataset:
    -   "A request with `fields: { <new-field>: true }` decodes an object that contains that field" (response-shape proof).
    -   "A request with `attributeCategoryCombo=<real-cc-id>` returns fewer results than the same request without the filter" (regression proof for the rename).
    -   "`TrackerEvents.getById(<known-event-id>, { fields: { event: true } })` returns exactly `{ event: <id> }`" (narrowing proof).
-   Fixtures: hard-coded UIDs from the play dataset (program `IpHINAT79UW` — Child Programme, tracked entity type `nEenWmSyUEp` — Person, a known event ID). These IDs are stable across play redeployments.
-   Timeouts: the default Vitest 5s timeout is too short for network — bump to 30s per file via `testTimeout` in the file's `describe` or via `vi.setConfig`.
-   These tests do **not** run as part of `yarn test` by default. They live under a separate Vitest project or tag (`"integration"`) and run via `yarn test:integration`. This keeps the unit-test suite hermetic and CI-friendly; integration runs are a deliberate step.

Trade-off accepted: if `play.dhis2.org/42` is down or its demo dataset changes, the integration suite fails. This is the cost of catching real-server-contract bugs. Unit tests for hermetic concerns (e.g., query-string serialization shape) are not added in this change — the integration suite covers the behavior; adding mocks on top would duplicate the assertion without improving coverage.

### 7. Spec lives in `openspec/specs/tracker/` only (no change to `src/2.42/schemas.ts`)

The tracker runtime clients are not schema-generated — they're hand-typed wrappers around a known v42 endpoint contract. The spec captures the contract; the code tracks the spec; the v42 docs are the oracle. `src/2.42/schemas.ts` describes metadata models (e.g., `D2DataApprovalWorkflow`) which the tracker endpoints don't serve.

## Risks / Trade-offs

-   **Silent behavior change on `TrackerEvents.getById`**: the response object shape doesn't change (v42 returned all the fields already), but the TypeScript type narrows. Any consumer that was accessing fields they didn't select via `fields` was relying on untyped data — they now get a compile error that documents the real contract. Acceptable.
-   **Deprecated `programStatus` on enrollments**: keeping both typed means two ways to do the same thing. The `@deprecated` JSDoc and a changelog note are the guardrails. Removing in a later release.
-   **`orgUnit: SemiColonDelimitedListOfUid` → `Id`**: if any consumer was relying on the string being semicolon-delimited (no evidence of this), their code breaks. Accepted — v42 does not emit that form.
-   **Integration tests depend on `play.dhis2.org/42`**: network outages or dataset changes on the demo server surface as test failures. Accepted per the premise of this change — the play server is assumed always-up. If this assumption proves wrong in practice, the mitigation is to snapshot a minimum set of fixtures from play and recreate them in a test-owned DHIS2 instance, not to mock.
-   **Credentials are hard-coded (`admin`/`district`)**: standard public demo credentials, committed in the test file. No secret management needed; if play ever rotates them, update the shared helper in one place.

## Data flow

```
┌────────────────────────────────────────────────────────────┐
│ consumer                                                   │
│   api.tracker.events.get({                                 │
│     program: "p1",                                         │
│     attributeCategoryCombo: "cc1",    ← fixed name         │
│     attributeCategoryOptions: "o1;o2",                     │
│     fields: { event: true, followUp: true },               │
│   })                                                       │
└───────────────────────┬────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────────┐
│ TrackerEvents.get (src/api/trackerEvents.ts)               │
│   - typed params reject unknown keys (attributeCc blocked) │
│   - fields serializer via getTrackerFieldsParam            │
│   - delegates to D2ApiGeneric                              │
└───────────────────────┬────────────────────────────────────┘
                        │ d2Api.get("/tracker/events",
                        │   { program: "p1",
                        │     attributeCategoryCombo: "cc1",
                        │     attributeCategoryOptions: "o1;o2",
                        │     fields: "event,followUp" })
                        ▼
┌────────────────────────────────────────────────────────────┐
│ D2ApiGeneric → HttpClientRepository → DHIS2 v42            │
│   (filter is now actually applied server-side)             │
└────────────────────────────────────────────────────────────┘
```

Enrollments and TrackedEntities follow the same path. `TrackerEvents.getById` skips query-param serialization beyond `fields`.
