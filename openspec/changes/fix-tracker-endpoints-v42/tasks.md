## 1. Runtime bug fixes (high priority)

-   [x] 1.1 [BE] In `src/api/trackerEvents.ts`, rename `EventsParamsBase.attributeCc` → `attributeCategoryCombo` and `attributeCos` → `attributeCategoryOptions`. Types are `Id` (not free-form `string`).
-   [x] 1.2 [BE] In `src/api/trackerEvents.ts`, rename `D2TrackerEventBase.followup` → `followUp` (camelCase). Update `D2TrackerEventToPost` and every internal reference in the same file.
-   [x] 1.3 [BE] In `src/api/trackerEvents.ts`, change `getById` signature to `getById<Fields extends D2TrackerEventFields>(id: string, params: { fields: Fields }): D2ApiResponse<SelectedPick<D2TrackerEventSchema, Fields>>`.

## 2. Param gaps

-   [x] 2.1 [BE] Extend `TrackedEntitiesParamsBase` in `src/api/trackerTrackedEntities.ts`: add `enrollmentStatus: ProgramStatus`, `idScheme: IdScheme`, `orgUnitIdScheme: IdScheme`. Widen `assignedUserMode` to include `"ALL"`. Add `"updatedAtClient"` to `TrackedOrderField.field`.
-   [x] 2.2 [BE] Remove v42-unsupported params from `TrackedEntitiesParamsBase`: `query`, `attribute`, `skipMeta`, `includeAllAttributes`.
-   [x] 2.3 [BE] Extend `TrackerEnrollmentsParamsBase` in `src/api/trackerEnrollments.ts`: add `status: ProgramStatus` and `order: CommaDelimitedListOfUid`. Mark `programStatus` with `@deprecated` JSDoc pointing to `status`.
-   [x] 2.4 [BE] Extend `EventsParamsBase` in `src/api/trackerEvents.ts`: add `enrollmentStatus: ProgramStatus` and `categoryOptionIdScheme: IdScheme`.
-   [x] 2.5 [BE] Remove v42-unsupported params from `EventsParamsBase`: `skipMeta`, `skipEventId`, bare `updatedAt` (keep `updatedAfter` / `updatedBefore` / `updatedWithin`).

## 3. Output type gaps

-   [x] 3.1 [BE] Extend `D2TrackerTrackedEntityBase` in `src/api/trackerTrackedEntities.ts`: add `potentialDuplicate: boolean`, `storedBy: Username`, `createdBy: UserInfo`, `updatedBy: UserInfo`. Import `Username` / `UserInfo` from `./trackerEvents` (already exports `UserInfo`; export `Username` if not). Change `orgUnit` type from `SemiColonDelimitedListOfUid` to `Id`.
-   [x] 3.2 [BE] Extend `D2TrackerEnrollment` in `src/api/trackerEnrollments.ts`: add `completedAt?: IsoDate`, `completedBy?: Username`, `geometry?: D2Geometry`, `createdBy: UserInfo`, `updatedBy: UserInfo`, `relationships?: Relationship[]`. Import `Relationship` from `./trackerTrackedEntities`.
-   [x] 3.3 [BE] Extend `D2TrackerEventBase` in `src/api/trackerEvents.ts`: add `createdAtClient: IsoDate`, `updatedAtClient: IsoDate`, `completedAt?: IsoDate`, `completedBy?: Username`, `assignedUser?: UserInfo`, `relationships?: Relationship[]`.

## 4. Integration tests (hit https://play.dhis2.org/42)

-   [x] 4.1 [BE] Add a `getPlayD2Api()` helper to `src/testing.ts` that constructs a `D2Api` against the DHIS2 v42 play server with `{ username: "admin", password: "district" }`. Export hard-coded play UIDs (program `IpHINAT79UW`, tracked entity type `nEenWmSyUEp`, org unit) as named constants on `playFixtures` so every integration file imports the same fixtures. (Note: `https://play.dhis2.org/42` redirects to `https://play.im.dhis2.org/stable-2-42-4`; the helper points at the resolved URL so `fetch` doesn't hit a login-UI redirect.)
-   [x] 4.2 [BE] Wire a separate Vitest config (`vitest.integration.config.ts`) for `*.integration.test.ts` with `testTimeout: 30_000`. Exclude the same pattern from the default `vitest.config.ts`. Add a `yarn test:integration` script.
-   [x] 4.3 [CR] Create `src/api/trackerTrackedEntities.integration.test.ts`. Asserts against real responses for program `IpHINAT79UW`: `enrollmentStatus: "COMPLETED"` narrows the total; `idScheme` / `orgUnitIdScheme` round-trip; `assignedUserMode: "ALL"` is accepted; `order: [{ type: "field", field: "updatedAtClient", direction: "desc" }]` returns a sorted list; response decodes `potentialDuplicate`, `createdBy`, `updatedBy`, and single-UID `orgUnit`.
-   [x] 4.4 [CR] Create `src/api/trackerEnrollments.integration.test.ts`. Asserts: `status: "COMPLETED"` narrows + every returned enrollment has `status === "COMPLETED"`; legacy `programStatus: "COMPLETED"` returns the same total (alias honored server-side); `order: "enrolledAt:desc"` sorts correctly; request with `fields: { completedAt, completedBy, createdBy, updatedBy, relationships }` decodes the typed fields.
-   [x] 4.5 [CR] Create `src/api/trackerEvents.integration.test.ts`. Asserts the runtime-bug regressions: (1) a request with `attributeCategoryCombo` + `attributeCategoryOptions` using unknown-but-valid UIDs returns a 409 (regression proof — the old `attributeCc` would have been silently ignored and returned 200); (2) `fields: { followUp: true }` decodes `event.followUp` as a typed boolean; (3) `enrollmentStatus: "COMPLETED"` narrows the result set; (4) `categoryOptionIdScheme: "UID"` round-trips.
-   [x] 4.6 [CR] In `trackerEvents.integration.test.ts`, add `describe("TrackerEvents.getById against play.dhis2.org/42")` using event `RcBUozdEU8o`. Assert that `.getById(id, { fields: { event: true, status: true } })` returns an object whose keys are exactly `["event", "status"]`, proving the `SelectedPick` narrowing works end-to-end.
-   [x] 4.7 [CR] Each integration test file imports fixtures from `playFixtures` in `src/testing.ts`. Concrete assertions (`toEqual`, `toBe`, sorted-array equality); no `toBeDefined` / `toBeTruthy` on knowable values.

## 5. Wire-up and docs

-   [x] 5.1 [BE] Re-export the tracker modules from `src/api/index.ts` so `D2TrackerEvent`, `D2TrackerEnrollment`, `D2TrackerTrackedEntity`, `Username`, `UserInfo`, `Relationship`, etc. are reachable at the package root.
-   [x] 5.2 [BE] Run `yarn lint`, `yarn test` (unit), and `yarn test:integration` (hitting the DHIS2 v42 play server). All green.
-   [x] 5.3 [BE] README audited; no references to `attributeCc` / `attributeCos` / `followup` exist, so no doc update needed.
