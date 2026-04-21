## 1. Runtime bug fixes (high priority)

-   [ ] 1.1 [BE] In `src/api/trackerEvents.ts`, rename `EventsParamsBase.attributeCc` → `attributeCategoryCombo` and `attributeCos` → `attributeCategoryOptions`. Types are `Id` (not free-form `string`).
-   [ ] 1.2 [BE] In `src/api/trackerEvents.ts`, rename `D2TrackerEventBase.followup` → `followUp` (camelCase). Update `D2TrackerEventToPost` and every internal reference in the same file.
-   [ ] 1.3 [BE] In `src/api/trackerEvents.ts`, change `getById` signature to `getById<Fields extends D2TrackerEventFields>(id: string, params: { fields: Fields }): D2ApiResponse<SelectedPick<D2TrackerEventSchema, Fields>>`.

## 2. Param gaps

-   [ ] 2.1 [BE] Extend `TrackedEntitiesParamsBase` in `src/api/trackerTrackedEntities.ts`: add `enrollmentStatus: ProgramStatus`, `idScheme: IdScheme`, `orgUnitIdScheme: IdScheme`. Widen `assignedUserMode` to include `"ALL"`. Add `"updatedAtClient"` to `TrackedOrderField.field`.
-   [ ] 2.2 [BE] Remove v42-unsupported params from `TrackedEntitiesParamsBase`: `query`, `attribute`, `skipMeta`, `includeAllAttributes`.
-   [ ] 2.3 [BE] Extend `TrackerEnrollmentsParamsBase` in `src/api/trackerEnrollments.ts`: add `status: ProgramStatus` and `order: CommaDelimitedListOfUid`. Mark `programStatus` with `@deprecated` JSDoc pointing to `status`.
-   [ ] 2.4 [BE] Extend `EventsParamsBase` in `src/api/trackerEvents.ts`: add `enrollmentStatus: ProgramStatus` and `categoryOptionIdScheme: IdScheme`.
-   [ ] 2.5 [BE] Remove v42-unsupported params from `EventsParamsBase`: `skipMeta`, `skipEventId`, bare `updatedAt` (keep `updatedAfter` / `updatedBefore` / `updatedWithin`).

## 3. Output type gaps

-   [ ] 3.1 [BE] Extend `D2TrackerTrackedEntityBase` in `src/api/trackerTrackedEntities.ts`: add `potentialDuplicate: boolean`, `storedBy: Username`, `createdBy: UserInfo`, `updatedBy: UserInfo`. Import `Username` / `UserInfo` from `./trackerEvents` (already exports `UserInfo`; export `Username` if not). Change `orgUnit` type from `SemiColonDelimitedListOfUid` to `Id`.
-   [ ] 3.2 [BE] Extend `D2TrackerEnrollment` in `src/api/trackerEnrollments.ts`: add `completedAt?: IsoDate`, `completedBy?: Username`, `geometry?: D2Geometry`, `createdBy: UserInfo`, `updatedBy: UserInfo`, `relationships?: Relationship[]`. Import `Relationship` from `./trackerTrackedEntities`.
-   [ ] 3.3 [BE] Extend `D2TrackerEventBase` in `src/api/trackerEvents.ts`: add `createdAtClient: IsoDate`, `updatedAtClient: IsoDate`, `completedAt?: IsoDate`, `completedBy?: Username`, `assignedUser?: UserInfo`, `relationships?: Relationship[]`.

## 4. Integration tests (hit https://play.dhis2.org/42)

-   [ ] 4.1 [BE] Add a `getPlayD2Api()` helper to `src/testing.ts` (or a new `src/testing/integration.ts`) that constructs a `D2Api` against `https://play.dhis2.org/42` with `{ username: "admin", password: "district" }`. Export hard-coded play UIDs (program `IpHINAT79UW`, tracked entity type `nEenWmSyUEp`, a known event ID and org unit) as named constants so every integration file imports the same fixtures.
-   [ ] 4.2 [BE] Wire a separate Vitest project/tag for integration tests so they do not run under the default `yarn test`. Add a `yarn test:integration` script that runs only `*.integration.test.ts` files with `testTimeout` bumped to 30s.
-   [ ] 4.3 [CR] Create `src/api/trackerTrackedEntities.integration.test.ts`. `describe("TrackedEntities.get against play.dhis2.org/42")` asserting against a real response for program `IpHINAT79UW`: `enrollmentStatus: "COMPLETED"` narrows the result set; `idScheme: "UID"` and `orgUnitIdScheme: "UID"` round-trip; `assignedUserMode: "ALL"` is accepted by the server (status 200); `order: [{ type: "field", field: "updatedAtClient", direction: "desc" }]` returns a sorted list; a TE request with `fields: { potentialDuplicate: true, storedBy: true, createdBy: true, updatedBy: true, orgUnit: true }` decodes an object exposing those typed fields.
-   [ ] 4.4 [CR] Create `src/api/trackerEnrollments.integration.test.ts`. `describe("TrackerEnrollments.get against play.dhis2.org/42")` asserting: `status: "COMPLETED"` returns only completed enrollments; legacy `programStatus: "COMPLETED"` returns the same set (alias still honored server-side); `order: "enrolledAt:desc"` sorts correctly; a request with `fields: { completedAt: true, completedBy: true, geometry: true, createdBy: true, updatedBy: true, relationships: true }` decodes all of those typed fields on at least one enrollment.
-   [ ] 4.5 [CR] Create `src/api/trackerEvents.integration.test.ts`. `describe("TrackerEvents.get against play.dhis2.org/42")` asserting the three runtime-bug regressions: (1) `attributeCategoryCombo` + `attributeCategoryOptions` narrow the result set vs. the same request without them (regression for the `attributeCc/Cos` rename — a mock cannot prove this); (2) `fields: { event: true, followUp: true }` returns objects with `followUp` as a typed member (regression for the typo fix); (3) `enrollmentStatus: "COMPLETED"` narrows the result set; (4) `categoryOptionIdScheme: "UID"` round-trips.
-   [ ] 4.6 [CR] In `trackerEvents.integration.test.ts`, add `describe("TrackerEvents.getById against play.dhis2.org/42")` using a known-stable play event ID. Assert that `.getById(id, { fields: { event: true, status: true } })` returns an object whose keys are exactly `["event", "status"]` (proving the `SelectedPick` narrowing works end-to-end against the real endpoint). Include a `type`-level assertion via `expectTypeOf` or equivalent that the response is not `D2TrackerEvent`.
-   [ ] 4.7 [CR] Each integration test file imports fixtures from the shared helper (task 4.1) — no per-file hard-coded IDs. Group related assertions with `describe` blocks; use `toEqual` / `toBe` for concrete values; never `toBeDefined` / `toBeTruthy` on values that are knowable.

## 5. Wire-up and docs

-   [ ] 5.1 [BE] Re-export newly typed fields (`Username`, `UserInfo`, any response fragment consumers may want to reference) from `src/index.ts` if they weren't already exported.
-   [ ] 5.2 [BE] Run `yarn lint`, `yarn test` (unit), and `yarn test:integration` (hitting `https://play.dhis2.org/42`); fix until all green before opening the PR.
-   [ ] 5.3 [BE] Update `README.md` examples section if it mentions `attributeCc` / `attributeCos` or shows an event-response destructure touching `followup`. If no such example exists, note "no doc update needed" in the PR description.
