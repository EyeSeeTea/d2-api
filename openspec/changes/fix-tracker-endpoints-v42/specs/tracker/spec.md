## ADDED Requirements

### Requirement: Tracker is exposed on D2Api

`D2Api` exposes a cached `tracker` getter with sub-clients `trackedEntities`, `enrollments`, and `events`. Each sub-client delegates HTTP transport to `D2ApiGeneric`.

#### Scenario: Cached sub-clients
- **WHEN** a consumer reads `api.tracker.trackedEntities`, `api.tracker.enrollments`, `api.tracker.events`
- **THEN** each returns a client instance
- **AND** repeated reads return the same instance (cached)

### Requirement: TrackedEntities.get targets /tracker/trackedEntities

`TrackedEntities.get(params)` issues `GET /tracker/trackedEntities`, serializes `fields` via the tracker field serializer, and joins `order` entries with `,`.

#### Scenario: Basic query
- **WHEN** called with `{ program: "p1", fields: { trackedEntity: true } }`
- **THEN** the request is `GET /tracker/trackedEntities?program=p1&fields=trackedEntity`
- **AND** the response decodes to `{ pager, trackedEntities: Array<…> }`

#### Scenario: enrollmentStatus is serialized
- **WHEN** called with `{ program: "p1", enrollmentStatus: "COMPLETED", fields: { trackedEntity: true } }`
- **THEN** the query string contains `enrollmentStatus=COMPLETED`

#### Scenario: idScheme and orgUnitIdScheme are serialized
- **WHEN** called with `{ program: "p1", idScheme: "UID", orgUnitIdScheme: "CODE", fields: { trackedEntity: true } }`
- **THEN** the query string contains `idScheme=UID` and `orgUnitIdScheme=CODE`

#### Scenario: assignedUserMode accepts ALL
- **WHEN** called with `{ program: "p1", assignedUserMode: "ALL", fields: { trackedEntity: true } }`
- **THEN** the query string contains `assignedUserMode=ALL`
- **AND** TypeScript accepts the call with no `as` cast

#### Scenario: order supports updatedAtClient
- **WHEN** called with `{ program: "p1", order: [{ type: "field", field: "updatedAtClient", direction: "desc" }], fields: { trackedEntity: true } }`
- **THEN** the query string contains `order=updatedAtClient:desc`

#### Scenario: Response exposes v42 fields
- **WHEN** the server returns a TE with `potentialDuplicate`, `storedBy`, `createdBy`, `updatedBy`, and `orgUnit: "<uid>"`
- **THEN** the decoded response preserves all of these fields with their v42 types
- **AND** `orgUnit` is typed as `Id` (single UID, not semicolon-delimited)

### Requirement: TrackerEnrollments.get targets /tracker/enrollments

`TrackerEnrollments.get(params)` issues `GET /tracker/enrollments` with `fields` serialized via the tracker field serializer.

#### Scenario: status replaces programStatus
- **WHEN** called with `{ program: "p1", status: "COMPLETED", fields: { enrollment: true } }`
- **THEN** the query string contains `status=COMPLETED`

#### Scenario: Legacy programStatus still accepted
- **WHEN** called with `{ program: "p1", programStatus: "COMPLETED", fields: { enrollment: true } }`
- **THEN** the query string contains `programStatus=COMPLETED`
- **AND** TypeScript marks `programStatus` with `@deprecated`

#### Scenario: order is serialized
- **WHEN** called with `{ program: "p1", order: "enrolledAt:desc", fields: { enrollment: true } }`
- **THEN** the query string contains `order=enrolledAt:desc`

#### Scenario: Response exposes v42 enrollment fields
- **WHEN** the server returns an enrollment with `completedAt`, `completedBy`, `geometry`, `createdBy`, `updatedBy`, `relationships`
- **THEN** the decoded response preserves all of these fields with their v42 types

### Requirement: TrackerEvents.get targets /tracker/events

`TrackerEvents.get(params)` issues `GET /tracker/events` and serializes the documented v42 params (not the legacy short names).

#### Scenario: attributeCategoryCombo and attributeCategoryOptions serialize with v42 names
- **WHEN** called with `{ program: "p1", attributeCategoryCombo: "cc1", attributeCategoryOptions: "o1;o2", fields: { event: true } }`
- **THEN** the query string contains `attributeCategoryCombo=cc1&attributeCategoryOptions=o1;o2`
- **AND** the query string does **not** contain `attributeCc` or `attributeCos`

#### Scenario: Legacy attributeCc and attributeCos are rejected by the compiler
- **WHEN** a consumer writes `.get({ attributeCc: "x", fields: { event: true } })`
- **THEN** TypeScript rejects the call (key not in `EventsParamsBase`)

#### Scenario: enrollmentStatus is serialized
- **WHEN** called with `{ program: "p1", enrollmentStatus: "COMPLETED", fields: { event: true } }`
- **THEN** the query string contains `enrollmentStatus=COMPLETED`

#### Scenario: categoryOptionIdScheme is serialized
- **WHEN** called with `{ program: "p1", categoryOptionIdScheme: "CODE", fields: { event: true } }`
- **THEN** the query string contains `categoryOptionIdScheme=CODE`

#### Scenario: followUp is emitted with camelCase name
- **WHEN** the server returns an event with `followUp: true`
- **THEN** the decoded response exposes `event.followUp === true`
- **AND** `event.followup` (lowercase) is not a typed member of `D2TrackerEvent`

#### Scenario: Response exposes v42 event fields
- **WHEN** the server returns an event with `createdAtClient`, `updatedAtClient`, `completedAt`, `completedBy`, `assignedUser`, `relationships`
- **THEN** the decoded response preserves all of these fields with their v42 types

### Requirement: TrackerEvents.getById returns a SelectedPick response

`TrackerEvents.getById(id, { fields })` issues `GET /tracker/events/{id}` and returns a response typed precisely to the selected fields.

#### Scenario: Response type matches fields
- **WHEN** called with `("eventId", { fields: { event: true, status: true } })`
- **THEN** the response type is `SelectedPick<D2TrackerEventSchema, { event: true; status: true }>`
- **AND** the decoded object contains exactly `{ event, status }`

#### Scenario: Only fields is accepted as a query param
- **WHEN** a consumer tries `.getById(id, { program: "p1", fields: { event: true } })`
- **THEN** TypeScript rejects the call (`program` not in the narrowed params type)
