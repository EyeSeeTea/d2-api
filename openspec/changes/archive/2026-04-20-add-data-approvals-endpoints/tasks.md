## 1. Types and state tuple

-   [x] 1.1 [BE] Create `src/api/dataApprovals.ts` with the `dataApprovalStates` const tuple and derived `DataApprovalState` type (8 states from the DHIS2 v42 doc)
-   [x] 1.2 [BE] Define `ApprovalSelector` (single: `wf | ds`, `pe: string`, `ou: Id`, optional `aoc: Id`) and `BulkApprovalSelector` (arrays: `wf[] | ds[]`, `pe[]`, `ou[]`, optional `aoc[]`) using `RequireAtLeastOne` from `src/utils/types.ts`
-   [x] 1.3 [BE] Define response types: `DataApprovalStatus` (single `get`), `DataApprovalBulkStatus` (bulk entry with nested `permissions`), `DataApprovalByCategoryOptionCombo`
-   [x] 1.4 [BE] Define bulk mutation payload type `BulkApprovalPayload` (`wf?: Id[]; ds?: Id[]; pe: string[]; approvals: Array<{ ou: Id; aoc: Id }>`) constrained by `RequireAtLeastOne` on `wf | ds`

## 2. DataApprovals class

-   [x] 2.1 [BE] Implement `DataApprovals` class with `constructor(public d2Api: D2ApiGeneric)`
-   [x] 2.2 [BE] Implement `get(params): D2ApiResponse<DataApprovalStatus>` → `GET /dataApprovals`
-   [x] 2.3 [BE] Implement `getMany(params): D2ApiResponse<DataApprovalBulkStatus[]>` → `GET /dataApprovals/approvals`, joining arrays with `","` and dropping undefined values
-   [x] 2.4 [BE] Implement `getByCategoryOptionCombos(params): D2ApiResponse<DataApprovalByCategoryOptionCombo[]>` → `GET /dataApprovals/categoryOptionCombos`
-   [x] 2.5 [BE] Implement `approve(params): D2ApiResponse<void>` → `POST /dataApprovals`
-   [x] 2.6 [BE] Implement `unapprove(params): D2ApiResponse<void>` → `DELETE /dataApprovals`
-   [x] 2.7 [BE] Implement `accept(params): D2ApiResponse<void>` → `POST /dataAcceptances`
-   [x] 2.8 [BE] Implement `unaccept(params): D2ApiResponse<void>` → `DELETE /dataAcceptances`
-   [x] 2.9 [BE] Implement `approveMany(payload): D2ApiResponse<void>` → `POST /dataApprovals/approvals`
-   [x] 2.10 [BE] Implement `unapproveMany(payload): D2ApiResponse<void>` → `POST /dataApprovals/unapprovals`
-   [x] 2.11 [BE] Implement `acceptMany(payload): D2ApiResponse<void>` → `POST /dataAcceptances/acceptances`
-   [x] 2.12 [BE] Implement `unacceptMany(payload): D2ApiResponse<void>` → `POST /dataAcceptances/unacceptances`
-   [x] 2.13 [BE] Extract a private helper (e.g., `toQueryParams`) that maps a bulk selector to a CSV-joined params dict and filters out undefined entries — use `Object.fromEntries` + `filter`, no mutable accumulator

## 3. Wire-up

-   [x] 3.1 [BE] Import `DataApprovals` in `src/api/d2Api.ts` and add a `@cache() get dataApprovals(): DataApprovals` next to `dataValues`
-   [x] 3.2 [BE] Re-export public types (`DataApprovalState`, `dataApprovalStates`, request/response shapes) from `src/index.ts` if needed so consumers can import without deep paths

## 4. Tests

-   [x] 4.1 [CR] Create `src/api/dataApprovals.test.ts` bootstrapped with `getMockApiFromClass(D2Api)` from `src/testing.ts`, mock adapter reset between tests
-   [x] 4.2 [CR] Add `describe("DataApprovals.get")` asserting request URL + query params and decoded response for both `wf`-only and `ds`-only calls; include one case with `aoc` and one without
-   [x] 4.3 [CR] Add `describe("DataApprovals.getMany")` asserting CSV join (`pe=201801,201802`), single-item array produces no trailing comma, and response array is decoded correctly
-   [x] 4.4 [CR] Add `describe("DataApprovals.getByCategoryOptionCombos")` with one request/response assertion
-   [x] 4.5 [CR] Add `describe("DataApprovals.approve")` and `describe("DataApprovals.unapprove")` asserting `POST` / `DELETE` URL and query params; assert response resolves to `undefined`
-   [x] 4.6 [CR] Add `describe("DataApprovals.accept")` and `describe("DataApprovals.unaccept")` with the same shape against `/dataAcceptances`
-   [x] 4.7 [CR] Add `describe("DataApprovals.approveMany")` asserting `POST /dataApprovals/approvals` with the exact JSON body; include one `wf` case and one `ds` case
-   [x] 4.8 [CR] Add `describe("DataApprovals.unapproveMany")`, `describe("DataApprovals.acceptMany")`, `describe("DataApprovals.unacceptMany")` asserting correct URL + JSON body
-   [x] 4.9 [CR] Extract shared fixture constants (sample workflow id, period, org unit, aoc) and helper `mockRequest(mock, method, url, response)` to keep tests DRY

## 5. Documentation and PR

-   [x] 5.1 [BE] Update `README.md` examples section with a short `api.dataApprovals.get(...)` snippet showing both workflow (`wf`) and bulk read usage
-   [x] 5.2 [BE] Run `yarn lint` and `yarn test` locally; both must pass before opening PR
