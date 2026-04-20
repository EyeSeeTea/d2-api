## Context

The `/api/dataApprovals` and `/api/dataAcceptances` surface in DHIS2 v42 is [documented here](https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-242/data-approval.html#data-approval). It covers four concerns over the same selector tuple `(workflow|dataSet, period, orgUnit, attributeOptionCombo)`:

1. **Read status** — single (`GET /dataApprovals`), bulk (`GET /dataApprovals/approvals`), per-AOC (`GET /dataApprovals/categoryOptionCombos`).
2. **Approve / unapprove** — `POST` / `DELETE /dataApprovals` and bulk variants `POST /dataApprovals/approvals` / `POST /dataApprovals/unapprovals`.
3. **Accept / unaccept** — `POST` / `DELETE /dataAcceptances` and bulk variants `POST /dataAcceptances/acceptances` / `POST /dataAcceptances/unacceptances`.
4. **Metadata** — `/api/dataApprovalWorkflows`, `/api/dataApprovalLevels` (already covered by `src/2.42/schemas.ts` — out of scope for this change).

The workflow selector has a legacy form: consumers can pass `ds=<dataSetId>` instead of `wf=<workflowId>`, in which case DHIS2 substitutes the workflow associated with the data set server-side. Both must be supported.

The library layering (`api/` → `data/`/`repositories/` → schemas + utils) makes the place for this class unambiguous: `src/api/dataApprovals.ts`, matching the sibling pattern of `src/api/dataValues.ts` and `src/api/messageConversations.ts`.

## Goals / Non-Goals

**Goals:**

-   Cover every endpoint in the "Data approval" section of the v42 Web API docs with a typed method.
-   Make the legacy `ds` parameter first-class at the TS level — consumers do not need to know it is legacy.
-   Hide CSV serialization behind typed arrays for bulk GETs (`pe: string[]`, `wf: Id[]`, …).
-   Encode the 8 approval states via the const-tuple pattern required by the project's TS conventions.
-   Provide concrete unit tests using the existing `getMockApiFromClass` / axios mock adapter pattern.

**Non-Goals:**

-   Modifying `/api/dataApprovalWorkflows` or `/api/dataApprovalLevels` clients — those already exist as metadata models in `src/2.42/schemas.ts`.
-   Adding server-aware validation (e.g., pre-flight checks that org unit level matches an approval level in the workflow). That is a server concern and errors already surface through `D2ApiResponse`.
-   Supporting DHIS2 versions other than v42 — the library is v42-only.
-   Introducing any new HTTP transport or utility — we reuse `D2ApiGeneric` and existing `HttpClientRepository`.

## Decisions

### 1. One class for the whole approval surface (`DataApprovals`)

Rationale: the DHIS2 docs treat approve/unapprove/accept/unaccept as one cohesive workflow driven by the same selectors. Splitting "status" vs "actions" would force consumers to wire two clients for a single flow, with no benefit. `DataAcceptances` endpoints are merged in under semantically-named methods (`accept`, `acceptMany`, …) rather than exposing a second class whose URL happens to be `/dataAcceptances`.

### 2. `wf | ds` via `RequireAtLeastOne`

```ts
type ApprovalSelector = RequireAtLeastOne<
    { wf?: Id; ds?: Id; pe: string; ou: Id; aoc?: Id },
    "wf" | "ds"
>;
```

Matches the precedent set by `src/api/messageConversations.ts:14`. `RequireAtLeastOne` from `src/utils/types.ts` is already a library primitive. If both are passed, both are forwarded — DHIS2 resolves the ambiguity server-side (workflow wins).

### 3. Bulk GET: arrays in, CSVs out

DHIS2 bulk GETs accept comma-separated values (`pe=201801,201802`). To avoid pushing string manipulation into consumer code:

-   Methods expose `string[]` / `Id[]` params.
-   The class joins with `","` before delegating to `d2Api.get`.
-   Undefined arrays are dropped from the query string (don't send `aoc=` when not provided).

```
consumer → { wf: ["w1","w2"], pe: ["201801"], ou: ["o1"] }
class    → d2Api.get("/dataApprovals/approvals", { wf: "w1,w2", pe: "201801", ou: "o1" })
```

### 4. Approval states as a const tuple

```ts
export const dataApprovalStates = [
    "UNAPPROVABLE",
    "UNAPPROVED_WAITING",
    "UNAPPROVED_ELSEWHERE",
    "UNAPPROVED_READY",
    "APPROVED_HERE",
    "APPROVED_ELSEWHERE",
    "ACCEPTED_HERE",
    "ACCEPTED_ELSEWHERE",
] as const;
export type DataApprovalState = (typeof dataApprovalStates)[number];
```

Required by CLAUDE.md's "derive union types from const arrays" rule. Enables runtime iteration (e.g., grouping by state) without unsafe casts.

### 5. Response shapes mirror the DHIS2 payloads verbatim

-   `DataApprovalStatus` (single `GET`) — `mayApprove`, `mayUnapprove`, `mayAccept`, `mayUnaccept`, `state`, optional `approvedBy`/`approvedAt`/`acceptedBy`/`acceptedAt`.
-   `DataApprovalBulkStatus[]` (bulk `GET`) — each entry has `wf`, `pe`, `ou`, `aoc`, optional `level`, nested `permissions` object, and `state`.
-   Mutation endpoints: `void` (DHIS2 returns 2xx with no meaningful body on success; errors surface through the HTTP layer).
-   Bulk mutation payload: `{ wf?: Id[]; ds?: Id[]; pe: string[]; approvals: Array<{ ou: Id; aoc: Id }> }` with the same `wf | ds` invariant.

Fields use `Readonly` where the value is a returned structure the consumer should not mutate. Per-field `?` optionality matches the docs.

### 6. Registration on `D2ApiVersioned`

Add a `@cache() get dataApprovals(): DataApprovals` next to `dataValues` in `src/api/d2Api.ts`. The `@cache()` decorator ensures a single instance per `D2Api`, matching sibling getters.

### 7. Testing strategy

-   File: `src/api/dataApprovals.test.ts`, colocated next to the module.
-   Approach: `getMockApiFromClass(D2Api)` from `src/testing.ts` produces a `D2Api` + `axios-mock-adapter` pair.
-   Coverage per method: at least one test per public method asserting both (a) the outgoing request URL + params/body and (b) the typed response is decoded correctly with a concrete `toEqual`.
-   `wf | ds` paths: test both `wf`-only and `ds`-only for at least one read and one mutation method — enough to prove the serializer handles both without testing every permutation.
-   Bulk CSV join: test that `pe: ["201801", "201802"]` lands as `?pe=201801,201802` in the request URL.
-   Empty/undefined `aoc`: test that an absent `aoc` is not serialized as a query param.
-   `describe` grouping: one `describe` per method family (`describe("DataApprovals.get")`, …) with concrete assertions (`toEqual`, `toBe`) and shared helpers for request/response fixtures.

## Risks / Trade-offs

-   **`wf | ds` semantic ambiguity**: if a consumer passes both, the server decides. We document "prefer `wf`" in the method JSDoc but do not throw. Throwing would surprise consumers migrating from raw HTTP where both were permitted.
-   **Bulk mutation payload validation**: we don't validate that each `(ou, aoc)` in `approvals[]` corresponds to an approvable selection. Mirrors the existing posture (`DataValues.postSet` doesn't pre-validate). Errors surface via the `D2ApiResponse`.
-   **Response field optionality**: the docs list `approvedBy`/`approvedAt`/`acceptedBy`/`acceptedAt` as "if present (not always needed)". We type them as optional to match — consumers must null-check. Making them required would lie.
-   **Over-specifying bulk state `level`**: the bulk GET response sometimes includes `level: Id`, sometimes not. Typed as optional.
-   **No cancellation semantics added**: existing `D2ApiResponse<T>` provides cancellation via `CancelableResponse`. We do not wrap or alter it.

## Data flow

```
┌───────────────────────────────────────────────────────────┐
│ consumer                                                  │
│   api.dataApprovals.getMany({                             │
│     wf: ["w1"], pe: ["201801","201802"], ou: ["o1"]       │
│   })                                                      │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│ DataApprovals (src/api/dataApprovals.ts)                  │
│   - validates selector via typed union                    │
│   - joins arrays with ","                                 │
│   - drops undefined entries                               │
│   - delegates to D2ApiGeneric                             │
└───────────────────────┬───────────────────────────────────┘
                        │ d2Api.get("/dataApprovals/approvals",
                        │          { wf: "w1", pe: "201801,201802", ou: "o1" })
                        ▼
┌───────────────────────────────────────────────────────────┐
│ D2ApiGeneric → HttpClientRepository → DHIS2               │
└───────────────────────────────────────────────────────────┘
```

All other methods follow the same path; bulk mutations POST a JSON body instead of query params, single mutations issue `POST` / `DELETE` with the selector as query params.
