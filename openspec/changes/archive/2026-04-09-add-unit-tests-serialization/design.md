## Context

`src/api/common.ts` contains three pure serialization functions used by every endpoint client in d2-api:

1. **`getFieldsAsString`** — recursively converts a fields selector object into DHIS2's comma-separated, bracket-nested field string (e.g., `{id: true, name: true, children: {id: true}}` → `"children[id],id,name"`).
2. **`getFilterAsString`** — converts a filter object into an array of DHIS2 filter strings (e.g., `{name: {like: "test"}}` → `["name:like:test"]`).
3. **`processFieldsFilterParams`** — combines both into a params dictionary, optionally prefixing keys with a model name.

These functions also rely on two internal helpers: `applyFieldTransformers` (handles `$fn` rename/size) and `toArray` (normalizes single items to arrays). A placeholder test file exists at `src/api/common.test.ts` but contains no real assertions.

## Goals / Non-Goals

**Goals:**
- Cover every code path in the three public serialization functions with concrete assertions.
- Document the expected serialization contract through test cases (serves as living documentation).
- Follow the project's testing conventions: colocated test file, `describe` grouping, concrete `toEqual`/`toBe` assertions, helper functions for repeated setup.

**Non-Goals:**
- Testing non-pure functions or functions that require HTTP mocking (e.g., `D2Api` endpoint methods).
- Refactoring the serialization functions themselves — this change is test-only.
- Adding integration or end-to-end tests against a DHIS2 instance.

## Decisions

1. **Single test file**: All tests go in `src/api/common.test.ts` since all three functions live in `src/api/common.ts`. Group by function using nested `describe` blocks.
2. **Direct function imports**: Import `getFieldsAsString`, `getFilterAsString`, and `processFieldsFilterParams` directly — no need for `D2Api` or mocking since these are pure functions.
3. **Sorted output awareness**: Both `getFieldsAsString` and `getFilterAsString` sort their output. Tests should assert the sorted result, not rely on insertion order.
4. **Edge cases via `isEmptyFilterValue`**: Test that filters with `undefined`, `null`, and `""` values are excluded (the internal `isEmptyFilterValue` guard).

## Risks / Trade-offs

- **Low risk**: These are pure functions with no side effects. Tests cannot break existing behavior.
- **`getFilterAsString` is not exported**: It's a module-private function. Tests will exercise it indirectly through `processFieldsFilterParams`. If direct testing is preferred, it would need to be exported — but indirect coverage via `processFieldsFilterParams` is sufficient and avoids changing the module's public API.
