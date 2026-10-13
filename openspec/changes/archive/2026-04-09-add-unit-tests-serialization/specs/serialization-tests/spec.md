## ADDED Requirements

### Requirement: getFieldsAsString serializes flat fields

`getFieldsAsString` converts a flat selector object with boolean values into a sorted, comma-separated string of field names.

#### Scenario: Single boolean field
- **WHEN** called with `{ id: true }`
- **THEN** returns `"id"`

#### Scenario: Multiple boolean fields are sorted alphabetically
- **WHEN** called with `{ name: true, id: true }`
- **THEN** returns `"id,name"`

#### Scenario: False fields are excluded
- **WHEN** called with `{ id: true, name: false, code: true }`
- **THEN** returns `"code,id"`

#### Scenario: Empty object
- **WHEN** called with `{}`
- **THEN** returns `""`

### Requirement: getFieldsAsString serializes nested fields

Nested objects produce bracket-delimited sub-field strings.

#### Scenario: One level of nesting
- **WHEN** called with `{ children: { id: true, name: true } }`
- **THEN** returns `"children[id,name]"`

#### Scenario: Multiple levels of nesting
- **WHEN** called with `{ parent: { children: { id: true } } }`
- **THEN** returns `"parent[children[id]]"`

#### Scenario: Mix of flat and nested fields
- **WHEN** called with `{ id: true, children: { name: true } }`
- **THEN** returns `"children[name],id"`

### Requirement: getFieldsAsString handles field transformers

Fields with a `$fn` property apply transformers (rename, size).

#### Scenario: Rename transformer
- **WHEN** called with `{ displayName: { $fn: { name: "rename", to: "name" }, $owner: true } }` (or equivalent structure with `$fn`)
- **THEN** the field key includes `~rename(name)` suffix

#### Scenario: Size transformer
- **WHEN** called with `{ children: { $fn: { name: "size" } } }`
- **THEN** the field key includes `~size` suffix

### Requirement: getFieldsAsString converts $ prefix to : prefix

Fields starting with `$` are converted to start with `:` (e.g., `$owner` → `:owner`).

#### Scenario: Dollar-prefixed field
- **WHEN** called with `{ $owner: true }`
- **THEN** returns `":owner"`


### Requirement: processFieldsFilterParams serializes value operator filters

Value operators produce `field:op:value` strings.

#### Scenario: Single eq filter
- **WHEN** called with filter `{ name: { eq: "test" } }`
- **THEN** the filter param contains `["name:eq:test"]`

#### Scenario: Like filter
- **WHEN** called with filter `{ name: { like: "test" } }`
- **THEN** the filter param contains `["name:like:test"]`

#### Scenario: Multiple operators on same field
- **WHEN** called with filter `{ age: { ge: "18", le: "65" } }`
- **THEN** the filter param contains both `"age:ge:18"` and `"age:le:65"` (sorted)


### Requirement: processFieldsFilterParams serializes array operator filters

Array operators (`in`, `!in`) produce `field:op:[values]` strings.

#### Scenario: In operator
- **WHEN** called with filter `{ status: { in: ["active", "pending"] } }`
- **THEN** the filter param contains `["status:in:[active,pending]"]`

#### Scenario: Not-in operator
- **WHEN** called with filter `{ status: { "!in": ["deleted"] } }`
- **THEN** the filter param contains `["status:!in:[deleted]"]`


### Requirement: processFieldsFilterParams serializes unary operator filters

Unary operators (`null`, `!null`, `empty`) produce `field:op` strings (no value).

#### Scenario: Null operator
- **WHEN** called with filter `{ parent: { null: true } }`
- **THEN** the filter param contains `["parent:null"]`

#### Scenario: Not-null operator
- **WHEN** called with filter `{ parent: { "!null": true } }`
- **THEN** the filter param contains `["parent:!null"]`

#### Scenario: Empty operator
- **WHEN** called with filter `{ name: { empty: true } }`
- **THEN** the filter param contains `["name:empty"]`


### Requirement: processFieldsFilterParams excludes empty filter values

Filters with empty values (`undefined`, `null`, `""`) are silently excluded.

#### Scenario: Undefined value
- **WHEN** called with filter `{ name: { eq: undefined } }`
- **THEN** the filter param is empty or excludes that entry

#### Scenario: Empty string value
- **WHEN** called with filter `{ name: { eq: "" } }`
- **THEN** the filter param is empty or excludes that entry


### Requirement: processFieldsFilterParams supports filter arrays

A field can have an array of filter objects, each producing independent filter strings.

#### Scenario: Array of filters on one field
- **WHEN** called with filter `{ name: [{ like: "foo" }, { like: "bar" }] }`
- **THEN** the filter param contains both `"name:like:bar"` and `"name:like:foo"` (sorted)


### Requirement: processFieldsFilterParams combines fields and filters

`processFieldsFilterParams` returns a dictionary with `fields` and `filter` keys.

#### Scenario: Both fields and filters provided
- **WHEN** called with `{ fields: { id: true, name: true }, filter: { name: { like: "test" } } }`
- **THEN** returns `{ fields: "id,name", filter: ["name:like:test"] }`

#### Scenario: Model name prefix
- **WHEN** called with `{ fields: { id: true }, filter: { name: { eq: "x" } } }` and `modelName = "user"`
- **THEN** returns `{ "user:fields": "id", "user:filter": ["name:eq:x"] }`

#### Scenario: No model name
- **WHEN** called with fields and filters but no model name
- **THEN** keys are `"fields"` and `"filter"` (no prefix)
