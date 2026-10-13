---
name: d2-api
description: "Use this skill whenever the user works with @eyeseetea/d2-api, the strongly-typed TypeScript library for interacting with the DHIS2 Web API. Trigger on any mention of d2-api, D2Api, DHIS2 API client, DHIS2 metadata queries, tracker imports, dataValues, dataStore, or any programmatic read/write against a DHIS2 instance. Also trigger when the user asks how to query, create, update, or delete DHIS2 metadata (dataSets, dataElements, indicators, organisationUnits, categoryOptionCombos, etc.) from TypeScript code, or when working with DHIS2 tracker, analytics, or SQL views via code."
---

# @eyeseetea/d2-api — DHIS2 TypeScript API Client

## Overview

`@eyeseetea/d2-api` is a strongly-typed TypeScript client for the DHIS2 Web API. It provides auto-generated schemas that keep all code fully typed. Always prefer the built-in typed methods (`api.models`, `api.metadata`) over raw requests.

## Core Principles

- All queries return a chainable object. Call `.getData()` to execute and get the typed result.
- Field selection is done via object literals with `true` values — this drives both the request and the return type.
- Prefer `api.models` (single metadata type) or `api.metadata` (multiple types in one request) over `api.request`. These provide full type safety out of the box.
- Use `api.request<T>()` only as a last resort for endpoints not yet covered by the typed API.

## Initialization

```typescript
import { D2Api } from "@eyeseetea/d2-api";

const api = new D2Api({
	baseUrl: "https://play.im.dhis2.org/dev",
	auth: { type: "basic", username: "admin", password: "district" },
});
```

## Querying a Single Metadata Type — `api.models`

Use `api.models.<metadataType>` for typed CRUD on one metadata type at a time.

### Get a paginated list

```typescript
const { objects, pager } = await api.models.dataSets
	.get({
		fields: { id: true, name: true, periodType: true },
		filter: { name: { ilike: "HIV" } },
		page: 1,
		pageSize: 50,
	})
	.getData();
// objects: Array<{ id: string; name: string; periodType: string }>
// pager: { page: number; pageCount: number; total: number; pageSize: number }
```

### Get by ID

```typescript
const dataSet = await api.models.dataSets
	.getById("dataset_id", {
		fields: {
			id: true,
			name: true,
			dataSetElements: { id: true, dataElement: { id: true, name: true } },
		},
	})
	.getData();
```

Nested fields follow the same `{ field: true }` or `{ field: { subfield: true } }` pattern for related objects and collections.

### Create / Update (POST)

```typescript
const response = await api.models.dataSets
	.post({
		id: "id_1",
		name: "My DataSet",
		periodType: "Monthly",
		// ... remaining required fields
	})
	.getData();
```

### Common metadata types available on `api.models`

`dataSets`, `dataElements`, `indicators`, `organisationUnits`, `organisationUnitGroups`, `categoryOptions`, `categories`, `categoryCombos`, `categoryOptionCombos`, `programs`, `programStages`, `users`, `userGroups`, `dashboards`, `visualizations`, `sqlViews`, `dataElementGroups`, `indicatorGroups`, `attributes`, and many more — the full list mirrors the DHIS2 metadata API.

## Querying Multiple Metadata Types — `api.metadata`

Use `api.metadata` when you need several metadata types in a single round-trip.

### GET multiple types

```typescript
const { dataElements, dataSets } = await api.metadata
	.get({
		dataSets: {
			fields: { id: true, name: true },
			filter: { name: { ilike: "Malaria" } },
		},
		dataElements: {
			fields: { id: true, name: true, valueType: true },
		},
	})
	.getData();
```

### POST multiple types (bulk import)

```typescript
const response = await api.metadata
	.post(
		{
			dataSets: [{ id: "ds1", name: "DS 1", periodType: "Monthly" }],
			dataElements: [
				{
					id: "de1",
					name: "DE 1",
					domainType: "AGGREGATE",
					valueType: "NUMBER",
				},
			],
		},
		// Optional import strategy
		{ importStrategy: "CREATE_AND_UPDATE" },
	)
	.getData();
```

## Specialized APIs

Some DHIS2 domains have dedicated typed interfaces instead of going through `api.models`.

| API                 | Use case                                                |
| ------------------- | ------------------------------------------------------- |
| `api.tracker`       | Tracker programs: tracked entities, enrollments, events |
| `api.dataValues`    | Aggregate data value sets (import/export)               |
| `api.dataStore`     | Key-value storage scoped to a namespace                 |
| `api.userDataStore` | Per-user key-value storage                              |

Consult the d2-api source or types for the exact method signatures on each. These follow the same `.getData()` pattern.

## Escape Hatch — `api.request<T>()`

For endpoints not covered by the typed API, use a manually-typed raw request. Always prefer `api.models` or `api.metadata` when the endpoint is available there.

```typescript
const response = await api
	.request<{ id: string; name: string }>({
		method: "get",
		url: "dataSets/id_1",
		params: {
			fields: "id,name",
		},
	})
	.getData();
// response is typed as { id: string; name: string }
```

Note that `params.fields` here is a plain comma-separated string (not the object literal syntax), because this bypasses the schema-driven type inference.

## Field Selection Patterns

The `fields` object is the key mechanism for both selecting data and narrowing the return type.

```typescript
// Scalar fields
fields: { id: true, name: true }

// Nested object (to-one relation)
fields: { id: true, categoryCombo: { id: true, name: true } }

// Nested collection (to-many relation)
fields: { id: true, dataSetElements: { id: true, dataElement: { id: true, name: true } } }

// All fields shorthand (use sparingly — returns a large payload)
fields: { $all: true }

// Owner fields (scalar + ids of relations, useful as a default)
fields: { $owner: true }
```

## Filtering

Filters use a typed object syntax within `.get()`:

```typescript
filter: { name: { ilike: "HIV" } }           // case-insensitive like
filter: { id: { in: ["id1", "id2", "id3"] } } // in a set
filter: { created: { ge: "2024-01-01" } }     // greater or equal
```

Multiple filter keys are AND-ed together.

## Pagination

```typescript
// Paginated (default)
const { objects, pager } = await api.models.dataElements
	.get({ fields: { id: true }, page: 1, pageSize: 100 })
	.getData();

// All pages at once (use with caution on large collections)
const { objects } = await api.models.dataElements
	.get({ fields: { id: true }, paging: false })
	.getData();
```

## Common Pitfalls

- **Forgetting `.getData()`** — Without it the request is never executed. The builder methods return a chainable query object, not a promise of data.
- **Using `api.request` when a typed method exists** — You lose type inference and autocomplete. Always check `api.models` first.
- **Over-fetching with `$all: true`** — Prefer explicit field selection for performance and clarity.
