## ADDED Requirements

### Requirement: DataApprovals is exposed on D2Api

The `D2Api` instance exposes a cached `dataApprovals` getter that returns a `DataApprovals` client.

#### Scenario: Getter returns a DataApprovals instance
- **WHEN** a consumer reads `api.dataApprovals`
- **THEN** a `DataApprovals` instance is returned
- **AND** repeated reads return the same instance (cached)

### Requirement: DataApprovalState union is derived from a const tuple

The library exports a `const` tuple `dataApprovalStates` containing the 8 approval states, and a type `DataApprovalState` derived from it via `(typeof dataApprovalStates)[number]`.

#### Scenario: Tuple lists the 8 states
- **WHEN** `dataApprovalStates` is read at runtime
- **THEN** it equals `["UNAPPROVABLE", "UNAPPROVED_WAITING", "UNAPPROVED_ELSEWHERE", "UNAPPROVED_READY", "APPROVED_HERE", "APPROVED_ELSEWHERE", "ACCEPTED_HERE", "ACCEPTED_ELSEWHERE"]`

#### Scenario: Type is assignable from tuple members
- **WHEN** any member of `dataApprovalStates` is assigned to a `DataApprovalState` variable
- **THEN** the TypeScript compiler accepts it with no `as` cast

### Requirement: get returns a single approval status

`DataApprovals.get(params)` issues `GET /dataApprovals` with the workflow/dataset, period, orgUnit, and optional attribute option combo selector.

#### Scenario: Query by workflow
- **WHEN** called with `{ wf: "rIUL3hYOjJc", pe: "201801", ou: "YuQRtpLP10I" }`
- **THEN** the request is `GET /dataApprovals?wf=rIUL3hYOjJc&pe=201801&ou=YuQRtpLP10I`
- **AND** the response is decoded into an object with `mayApprove`, `mayUnapprove`, `mayAccept`, `mayUnaccept`, `mayReadData`, and `state`

#### Scenario: Legacy query by data set
- **WHEN** called with `{ ds: "BfMAe6Itzgt", pe: "201801", ou: "YuQRtpLP10I" }`
- **THEN** the request is `GET /dataApprovals?ds=BfMAe6Itzgt&pe=201801&ou=YuQRtpLP10I`

#### Scenario: Optional aoc is forwarded when provided
- **WHEN** called with `{ wf: "w1", pe: "201801", ou: "o1", aoc: "a1" }`
- **THEN** the query string includes `aoc=a1`

#### Scenario: Optional aoc is omitted when absent
- **WHEN** called without `aoc`
- **THEN** no `aoc` parameter appears in the query string

#### Scenario: Requires wf or ds
- **WHEN** a consumer tries to call `get` without `wf` and without `ds`
- **THEN** the TypeScript compiler rejects the call

#### Scenario: wf and ds are mutually exclusive
- **WHEN** a consumer tries to call `get` with both `wf` and `ds`
- **THEN** the TypeScript compiler rejects the call
- **AND** the rejection prevents silently sending both to the server, which would otherwise resolve `ds` and ignore `wf`

### Requirement: getMany returns approval statuses in bulk

`DataApprovals.getMany(params)` issues `GET /dataApprovals/approvals` with comma-joined CSV parameters derived from arrays.

#### Scenario: Arrays are serialized as CSV
- **WHEN** called with `{ wf: ["w1","w2"], pe: ["201801","201802"], ou: ["o1"] }`
- **THEN** the request is `GET /dataApprovals/approvals?wf=w1,w2&pe=201801,201802&ou=o1`

#### Scenario: Single-item array is serialized as one value
- **WHEN** called with `{ wf: ["w1"], pe: ["201801"], ou: ["o1"] }`
- **THEN** the query string contains `wf=w1` (no trailing comma)

#### Scenario: Response is a list of status entries
- **WHEN** the server returns a JSON array of `{ wf, pe, ou, aoc, state, permissions, level? }`
- **THEN** the response is decoded into an array of those entries preserving all fields

#### Scenario: Legacy ds arrays also serialize as CSV
- **WHEN** called with `{ ds: ["ds1","ds2"], pe: ["201801"], ou: ["o1"] }`
- **THEN** the query string contains `ds=ds1,ds2`

### Requirement: getByCategoryOptionCombos returns status per AOC

`DataApprovals.getByCategoryOptionCombos(params)` issues `GET /dataApprovals/categoryOptionCombos` with a single-valued selector.

#### Scenario: Single selector
- **WHEN** called with `{ wf: "w1", pe: "201801", ou: "o1" }`
- **THEN** the request is `GET /dataApprovals/categoryOptionCombos?wf=w1&pe=201801&ou=o1`

### Requirement: approve approves a single selection

`DataApprovals.approve(params)` issues `POST /dataApprovals` with the selector.

#### Scenario: POST carries the selector as query params
- **WHEN** called with `{ wf: "w1", pe: "201801", ou: "o1" }`
- **THEN** the request is `POST /dataApprovals?wf=w1&pe=201801&ou=o1`
- **AND** the response type is `void`

### Requirement: unapprove unapproves a single selection

`DataApprovals.unapprove(params)` issues `DELETE /dataApprovals` with the selector.

#### Scenario: DELETE carries the selector as query params
- **WHEN** called with `{ wf: "w1", pe: "201801", ou: "o1" }`
- **THEN** the request is `DELETE /dataApprovals?wf=w1&pe=201801&ou=o1`

### Requirement: accept accepts an already-approved selection

`DataApprovals.accept(params)` issues `POST /dataAcceptances` with the selector.

#### Scenario: POST to the dataAcceptances resource
- **WHEN** called with `{ wf: "w1", pe: "201801", ou: "o1" }`
- **THEN** the request is `POST /dataAcceptances?wf=w1&pe=201801&ou=o1`

### Requirement: unaccept unaccepts a selection

`DataApprovals.unaccept(params)` issues `DELETE /dataAcceptances` with the selector.

#### Scenario: DELETE on the dataAcceptances resource
- **WHEN** called with `{ wf: "w1", pe: "201801", ou: "o1" }`
- **THEN** the request is `DELETE /dataAcceptances?wf=w1&pe=201801&ou=o1`

### Requirement: approveMany performs bulk approval

`DataApprovals.approveMany(payload)` issues `POST /dataApprovals/approvals` with a JSON body.

#### Scenario: Bulk approve with wf and pe arrays
- **WHEN** called with `{ wf: ["w1","w2"], pe: ["201601","201602"], approvals: [{ ou: "o1", aoc: "a1" }] }`
- **THEN** the request is `POST /dataApprovals/approvals`
- **AND** the JSON body equals `{ wf: ["w1","w2"], pe: ["201601","201602"], approvals: [{ ou: "o1", aoc: "a1" }] }`

#### Scenario: Bulk approve with legacy ds
- **WHEN** called with `{ ds: ["ds1"], pe: ["201601"], approvals: [{ ou: "o1", aoc: "a1" }] }`
- **THEN** the JSON body carries `ds: ["ds1"]` and no `wf` field

### Requirement: unapproveMany performs bulk unapproval

`DataApprovals.unapproveMany(payload)` issues `POST /dataApprovals/unapprovals` with the same JSON shape as `approveMany`.

#### Scenario: Bulk unapprove posts to unapprovals
- **WHEN** called with `{ wf: ["w1"], pe: ["201601"], approvals: [{ ou: "o1", aoc: "a1" }] }`
- **THEN** the request is `POST /dataApprovals/unapprovals` with that JSON body

### Requirement: acceptMany performs bulk acceptance

`DataApprovals.acceptMany(payload)` issues `POST /dataAcceptances/acceptances` with the same JSON shape.

#### Scenario: Bulk accept posts to acceptances
- **WHEN** called with `{ wf: ["w1"], pe: ["201601"], approvals: [{ ou: "o1", aoc: "a1" }] }`
- **THEN** the request is `POST /dataAcceptances/acceptances` with that JSON body

### Requirement: unacceptMany performs bulk unacceptance

`DataApprovals.unacceptMany(payload)` issues `POST /dataAcceptances/unacceptances` with the same JSON shape.

#### Scenario: Bulk unaccept posts to unacceptances
- **WHEN** called with `{ wf: ["w1"], pe: ["201601"], approvals: [{ ou: "o1", aoc: "a1" }] }`
- **THEN** the request is `POST /dataAcceptances/unacceptances` with that JSON body
