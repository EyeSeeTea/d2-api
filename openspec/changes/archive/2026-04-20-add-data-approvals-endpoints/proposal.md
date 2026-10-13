## Why

DHIS2 exposes a full `/api/dataApprovals` and `/api/dataAcceptances` surface for querying, approving, unapproving, accepting and unaccepting data — per workflow (or legacy data set), period, organisation unit and attribute option combo. The d2-api library currently has **no runtime module** for this surface: consumers can only read the metadata of workflows and levels through `src/2.42/schemas.ts` (`D2DataApprovalWorkflow`, `D2DataApprovalLevel`), but cannot perform approval status checks or mutations without dropping down to raw HTTP.

This leaves a material gap in v42 coverage for any application that drives approval workflows (dashboards showing approval state, approval UIs, bulk operations from scheduled jobs).

## What Changes

- Add a new `DataApprovals` class at `src/api/dataApprovals.ts` that exposes:
  - **Read**: `get`, `getMany`, `getByCategoryOptionCombos`
  - **Approve / unapprove**: `approve`, `unapprove`, `approveMany`, `unapproveMany`
  - **Accept / unaccept**: `accept`, `unaccept`, `acceptMany`, `unacceptMany`
- Wire the class into `D2ApiVersioned` as a cached getter `dataApprovals` (`src/api/d2Api.ts`), next to `dataValues`.
- Support both `wf` (workflow, current) and `ds` (data set, legacy) selectors via `RequireAtLeastOne<…, "wf" | "ds">`.
- For bulk GET endpoints that accept CSV query parameters, expose arrays (`Id[]`, `string[]`) on the TS API and serialize to comma-joined strings internally — consumers never build CSVs by hand.
- Encode the 8 approval states (`UNAPPROVABLE`, `UNAPPROVED_WAITING`, `UNAPPROVED_ELSEWHERE`, `UNAPPROVED_READY`, `APPROVED_HERE`, `APPROVED_ELSEWHERE`, `ACCEPTED_HERE`, `ACCEPTED_ELSEWHERE`) as a `const` array with a derived `DataApprovalState` type.
- Colocated Vitest suite at `src/api/dataApprovals.test.ts` covering each method against a mock adapter.
- Re-export public types (`DataApprovalState`, request/response shapes) from `src/index.ts` if needed for consumers.

## Capabilities

### New Capabilities

- `data-approvals`: Runtime API client for DHIS2 `/api/dataApprovals` and `/api/dataAcceptances` resources — covers status queries (single, bulk, per-AOC) and mutations (approve/unapprove/accept/unaccept, single and bulk), including legacy `ds` fallback.

### Modified Capabilities

_(none — `dataApprovalWorkflows` / `dataApprovalLevels` metadata remain unchanged in `src/2.42/schemas.ts`.)_

## Impact

- **Code**: new `src/api/dataApprovals.ts` and `src/api/dataApprovals.test.ts`; modified `src/api/d2Api.ts` (new cached getter); possibly `src/index.ts` (re-exports).
- **Dependencies**: none new. Reuses `D2ApiGeneric`, `D2ApiResponse`, existing `HttpClientRepository` transports, and the `RequireAtLeastOne` utility already used by `src/api/messageConversations.ts`.
- **APIs**: **purely additive** — no existing public interface changes. Consumers who don't touch `dataApprovals` see no difference.
- **Compatibility**: v42 only (matches the library's v42-only non-goal).
- **Rollback**: revert the new files and the getter registration. No data migrations, no schema changes.
- **Risk**: low. All new code is behind one new getter and backed by unit tests with mocked HTTP.
