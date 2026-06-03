## Why

The core serialization functions in `src/api/common.ts` — `getFieldsAsString`, `getFilterAsString`, and `processFieldsFilterParams` — are pure functions that convert TypeScript selector objects into DHIS2 query parameter strings. They are critical to the correctness of every API call the library makes, yet they have no unit tests. Adding tests now ensures regressions are caught early and documents the expected serialization behavior for contributors.

## What Changes

- Add comprehensive unit tests for `getFieldsAsString` covering flat fields, nested fields, field transformers (`$fn` rename/size), boolean exclusion, and `:` prefix conversion.
- Add comprehensive unit tests for `getFilterAsString` covering value operators, array operators (`in`, `!in`), unary operators (`null`, `!null`, `empty`), multiple filters on a single field, empty/undefined filter values, and filter arrays.
- Add comprehensive unit tests for `processFieldsFilterParams` covering combined fields+filter serialization, optional `modelName` prefixing, and edge cases (empty fields, empty filters).

## Capabilities

### New Capabilities

- `serialization-tests`: Unit test suite for the pure serialization functions (`getFieldsAsString`, `getFilterAsString`, `processFieldsFilterParams`) in `src/api/common.ts`.

### Modified Capabilities

_(none)_

## Impact

- **Code**: `src/api/common.test.ts`
- **Dependencies**: No new dependencies; uses Vitest (already configured).
- **APIs**: No API changes — tests only exercise existing internal functions.
- **Risk**: Zero — read-only tests against pure functions, no side effects.
