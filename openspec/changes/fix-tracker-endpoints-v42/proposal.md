## Why

The Tracker read clients in `src/api/tracker*.ts` drifted from the DHIS2 v42 Web API. The cross-check of [the documentation](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-242/tracker.html) against `TrackedEntities.get`, `TrackerEnrollments.get`, `TrackerEvents.get` and `TrackerEvents.getById` surfaced three classes of problem, one of which produces requests DHIS2 v42 will silently ignore:

1. **Runtime bugs** — param names that simply do not exist in v42:

    - `TrackerEvents.get` exposes `attributeCc` / `attributeCos`. v42 documents `attributeCategoryCombo` / `attributeCategoryOptions`. Consumers setting these today send query strings DHIS2 drops, so the filter silently has no effect.
    - `D2TrackerEvent.followup` is lowercased; the canonical v42 field is `followUp`. Destructuring `event.followUp` today produces `undefined`.
    - `TrackerEvents.getById` is typed `D2ApiResponse<D2TrackerEvent>` — the generic `Fields` passed by the caller is accepted but then thrown away, so the compiler doesn't catch field mismatches.

2. **Missing documented parameters** — v42 documents request params the library doesn't expose, so consumers must fall back to untyped `any`-style escapes:

    - TE: `enrollmentStatus`, `idScheme`, `orgUnitIdScheme`, `assignedUserMode="ALL"`, `order` field `updatedAtClient`.
    - Enrollments: `status` (replaces the deprecated `programStatus`), `order`.
    - Events: `enrollmentStatus`, `categoryOptionIdScheme`.

3. **Missing documented response fields** — v42 sample responses contain fields the TS types omit, so `SelectedPick<…, Fields>` can't even reference them:
    - TE: `potentialDuplicate`, `storedBy`, `createdBy`, `updatedBy`.
    - Enrollment: `completedAt`, `completedBy`, `geometry`, `createdBy`, `updatedBy`, `relationships`.
    - Event: `createdAtClient`, `updatedAtClient`, `completedAt`, `completedBy`, `assignedUser`, `relationships`.

Mutation (`Tracker.post` / `postAsync`) and job polling stay out of scope — this proposal is intentionally restricted to the **read surface** because (1) that's where the runtime bugs live and (2) bundling all the drift at once would make the diff unreviewable.

## What Changes

### Runtime bugs (high priority)

-   **BREAKING**: rename `EventsParamsBase.attributeCc` → `attributeCategoryCombo` and `EventsParamsBase.attributeCos` → `attributeCategoryOptions` in `src/api/trackerEvents.ts`. The old names don't currently produce the advertised behavior, so "breaking" here means "removing a param that was already non-functional" — consumers that wrote `.get({ attributeCc })` were shipping a no-op.
-   **BREAKING**: rename `D2TrackerEventBase.followup` → `followUp`.
-   Fix `TrackerEvents.getById` return type to `SelectedPick<D2TrackerEventSchema, Fields>` and narrow its params to `{ fields: Fields }` (the single-object endpoint only accepts `fields`).

### Param gaps

-   `TrackedEntitiesParamsBase`: add `enrollmentStatus`, `idScheme`, `orgUnitIdScheme`; widen `assignedUserMode` with `"ALL"`; extend `TrackedOrderField.field` with `"updatedAtClient"`; remove legacy v42-unsupported params (`query`, `attribute`, `skipMeta`, `includeAllAttributes`).
-   `TrackerEnrollmentsParamsBase`: add `status` (v42 canonical name for `programStatus`), keep `programStatus` as `@deprecated` alias during a single-release deprecation window, add `order`.
-   `EventsParamsBase`: add `enrollmentStatus`, `categoryOptionIdScheme`; remove legacy `skipMeta`, `skipEventId`, bare `updatedAt`.

### Output type gaps

-   Extend `D2TrackerTrackedEntityBase` with `potentialDuplicate: boolean`, `storedBy: Username`, `createdBy: UserInfo`, `updatedBy: UserInfo`. Tighten `orgUnit: SemiColonDelimitedListOfUid` to `Id` (single UID per v42 response sample).
-   Extend `D2TrackerEnrollment` with `completedAt?`, `completedBy?`, `geometry?`, `createdBy`, `updatedBy`, `relationships?`.
-   Extend `D2TrackerEvent` with `createdAtClient`, `updatedAtClient`, `completedAt?`, `completedBy?`, `assignedUser?`, `relationships?`.

### Tests — integration against `https://play.dhis2.org/42`

-   Add `*.integration.test.ts` files colocated next to each tracker client. Tests hit the public DHIS2 v42 play server at `https://play.dhis2.org/42` with the standard demo credentials (`admin` / `district`); the server is assumed always-up.
-   Mocked tests (`axios-mock-adapter`, `getMockApiFromClass`) are **not** added for this change. A mock would faithfully reproduce the same "silently ignore unknown param" behavior the real server has today, so it can't catch the `attributeCc` / `attributeCos` / `followup` runtime bugs. Integration tests against play do.
-   Coverage: every new param has a test proving the real server honors it (usually "result set narrows when filter is applied"); every new output field has a test proving it decodes on a real response; `TrackerEvents.getById` has a test proving its response contains only the requested fields end-to-end.
-   Integration tests run under a separate `yarn test:integration` script, not under the default `yarn test`. The unit suite stays hermetic.

## Capabilities

### New Capabilities

-   `tracker`: Runtime API client for the DHIS2 v42 Tracker read endpoints (`/api/tracker/trackedEntities`, `/api/tracker/enrollments`, `/api/tracker/events`, `/api/tracker/events/{id}`). Captures the params and response shapes currently implemented plus the gaps this change closes.

### Modified Capabilities

_(none — no prior spec for `tracker` exists in `openspec/specs/`; this change adds one scoped to the read endpoints.)_

## Impact

-   **Code**: modified `src/api/trackerTrackedEntities.ts`, `src/api/trackerEnrollments.ts`, `src/api/trackerEvents.ts`. New files: three `*.integration.test.ts` suites colocated with their clients, plus a shared `getPlayD2Api()` helper in `src/testing.ts` (or `src/testing/integration.ts`). `src/api/tracker.ts` unchanged. `src/index.ts` updated only if new public types need re-export. A new `test:integration` script in `package.json`.
-   **Dependencies**: none new.
-   **APIs**: the three `*.get` methods keep their signatures; only their input param types and response types change. `TrackerEvents.getById` signature narrows (from full `EventsParams<Fields>` to `{ fields: Fields }`) — this is a breaking change for any caller passing filter params that the endpoint silently ignored.
-   **Compatibility**: v42 only. The three BREAKING renames (`attributeCc` → `attributeCategoryCombo`, `attributeCos` → `attributeCategoryOptions`, `followup` → `followUp`) require a semver minor bump per the library's "v42-only" stance. Consumers get a compile error at call sites — easier to fix than the current silent no-op.
-   **Rollback**: revert the three files. No data migrations, no schema regeneration, no wiring changes in `D2Api`.
-   **Risk**: low. Each change is additive at the response layer (extra fields on response interfaces don't break consumers) or rename-at-compile-time at the request layer (consumers see a TS error, not a runtime surprise). Tests back each change with a concrete assertion against a live DHIS2 v42 server (`https://play.dhis2.org/42`) — the same server consumers will talk to in production.
