## 1. getFieldsAsString Tests

- [x] 1.1 Add `describe("getFieldsAsString")` with tests for flat boolean fields: single field, multiple sorted fields, false exclusion, empty object
- [x] 1.2 Add tests for nested fields: one level, multiple levels, mix of flat and nested
- [x] 1.3 Add tests for field transformers: `$fn` rename produces `~rename(to)` suffix, `$fn` size produces `~size` suffix
- [x] 1.4 Add test for `$` prefix conversion to `:` prefix (e.g., `$owner` → `:owner`)

## 2. Filter Serialization Tests (via processFieldsFilterParams)

- [x] 2.1 Add `describe("processFieldsFilterParams")` with tests for value operators (`eq`, `like`, `ge`, `le`, etc.) producing `field:op:value` strings
- [x] 2.2 Add tests for array operators (`in`, `!in`) producing `field:op:[values]` strings
- [x] 2.3 Add tests for unary operators (`null`, `!null`, `empty`) producing `field:op` strings
- [x] 2.4 Add tests for empty filter value exclusion (`undefined`, `null`, `""` are silently dropped)
- [x] 2.5 Add tests for filter arrays (array of filter objects on a single field)

## 3. processFieldsFilterParams Combined Tests

- [x] 3.1 Add tests for combined fields + filters producing a dictionary with `fields` and `filter` keys
- [x] 3.2 Add tests for `modelName` prefix: keys become `"modelName:fields"` and `"modelName:filter"`
- [x] 3.3 Add test for no model name (keys are plain `"fields"` and `"filter"`)
