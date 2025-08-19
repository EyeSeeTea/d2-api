# d2-api

Typescript library for the DHIS2 API.

## Generate schemas

This task generate the schemas for active API versions from play.dhis2.org instances.

```shell
$ yarn generate-schemas
```

## Development

```shell
$ yarn install
$ yarn build
$ cd build
$ yarn link
```

On your app:

```shell
$ yarn link d2-api
```

## Publish

```shell
$ yarn build
$ yarn publish [--tag beta] [--patch | --minor | --major]
```

## Usage

### Create an API instance

```ts
import { D2Api } from "d2-api/2.36";

const api = new D2Api({
    baseUrl: "https://play.im.dhis2.org/dev",
    auth: { username: "admin", password: "district" },
});
```

### Metadata models

#### GET single (by ID)

```ts
const dataSet = await api.models.dataSets
    .getById("BfMAe6Itzgt", {
        fields: {
            id: true,
            name: true,
            categoryOptions: {
                id: true,
                name: true,
            },
        },
    })
    .getData();

console.log(dataSet.id, dataSet.name, dataSet.categoryOptions);
```

#### GET (list)

```ts
const response = await api.models.dataSets
    .get({
        fields: {
            id: true,
            name: true,
        },
        filter: {
            name: { ilike: "health", "!in": ["Child Health"] },
            code: { $like: "DS_" },
        },
        order: "name:asc",
        paging: false,
    })
    .getData();
```

#### POST (create)

```ts
const response = await api.models.dataSets
    .post({
        name: "My DataSet",
        periodType: "Monthly",
    })
    .getData();
```

#### PUT (update)

```ts
const response = await api.models.dataSets
    .put({
        id: "Ew82BhPZkpa",
        name: "My DataSet",
        periodType: "Daily",
    })
    .getData();
```

#### DELETE (delete)

```ts
const response = await api.models.dataSets
    .delete({
        id: "Ew82BhPZkpa",
    })
    .getData();
```

#### PATCH (JSON Patch operations)

The patch method supports the following operations according to [RFC 6902](https://datatracker.ietf.org/doc/html/rfc6902) and DHIS2 extensions. The `path` field uses [JSON Pointer](https://datatracker.ietf.org/doc/html/rfc6901) syntax:

-   **`add`**: Adds a value to an object or array
-   **`remove`**: Removes a value from an object or array
-   **`replace`**: Replaces a value in an object or array
-   **`remove-by-id`**: DHIS2-specific operation to remove an item by ID from an array

```ts
// Examples of different patch operations
const patchOperations = [
    // Add a new property
    { op: "add", path: "/description", value: "New Description" },

    // Add to end of array (using -)
    { op: "add", path: "/users/-", value: { id: "FVsLhslRbTK" } },

    // Add to specific array index (0 is the array index)
    { op: "add", path: "/users/0", value: { id: "FVsLhslRbTK" } },

    // Replace existing property
    { op: "replace", path: "/name", value: "Updated Name" },

    // Remove property
    { op: "remove", path: "/description" },

    // Remove array item by index (1 is the array index)
    { op: "remove", path: "/users/1" },

    // DHIS2-specific: Remove array item by ID
    { op: "remove-by-id", path: "/users", id: "FVsLhslRbTK" },
];
```

```ts
// Patch dataSets
const response = await api.models.dataSets
    .patch("BfMAe6Itzgt", [
        { op: "replace", path: "/name", value: "Updated Child Health" },
        { op: "add", path: "/code", value: "DS_359711_NEW" },
        { op: "remove", path: "/description" },
        { op: "add", path: "/dataSetElements/-", value: { id: "x3Do5e7g4Qo" } },
        { op: "remove-by-id", path: "/organisationUnits", id: "TGRCfJEnXJr" },
    ])
    .getData();

// Patch users
const userResponse = await api.models.users
    .patch("gEnZri18JsV", [
        { op: "replace", path: "/name", value: "Ali new" },
        { op: "add", path: "/email", value: "ali.dummy@dhis2.org" },
        { op: "replace", path: "/disabled", value: true },
    ])
    .getData();

// Patch data elements
const elementResponse = await api.models.dataElements
    .patch("fbfJHSPpUQD", [
        { op: "replace", path: "/name", value: "ANC first visit" },
        { op: "replace", path: "/valueType", value: "INTEGER" },
        { op: "add", path: "/domainType", value: "TRACKER" },
        { op: "add", path: "/dataElementGroups/-", value: { id: "k1M0nuodfhN" } },
        { op: "remove-by-id", path: "/dataElementGroups", id: "k1M0nuodfhN" },
    ])
    .getData();

// Patch organisation units
const orgUnitResponse = await api.models.organisationUnits
    .patch("bL4ooGhyHRQ", [
        { op: "replace", path: "/name", value: "New Pujehun Name" },
        { op: "add", path: "/code", value: "OU_260377_NEW" },
        { op: "remove-by-id", path: "/children", id: "RzKeCma9qb1" },
        { op: "add", path: "/children/-", value: { id: "RzKeCma9qb1" } },
    ])
    .getData();
```

### Metadata

#### GET

```ts
const response = await api.metadata
    .get({
        dataSets: {
            fields: {
                id: true,
                name: true,
                organisationUnits: {
                    id: true,
                    name: true,
                },
            },
            filter: {
                name: { ilike: "health", "!in": ["Child Health"] },
                code: { $like: "DS_" },
            },
        },
        categories: {
            fields: {
                $owner: true,
            },
        },
    })
    .getData();

console.log(response);
```

#### POST

```ts
const response = await api.metadata
    .post({
        dataSets: [
            {
                name: "My DataSet",
                periodType: "Monthly",
            },
        ],
    })
    .getData();

console.log(response);
```

### Analytics

#### Get

```ts
const analyticsData = await api.analytics
    .get({
        dimension: ["dx:fbfJHSPpUQD;cYeuwXTCPkU"],
        filter: ["pe:2014Q1;2014Q2", "ou:O6uvpzGd5pu;lc3eMKXaEfw"],
    })
    .getData();
```

#### Get enrollments query

```ts
const analyticsData = await api.analytics
    .getEnrollmentsQuery("IpHINAT79UW", {
        dimension: ["GxdhnY5wmHq", "ou:ImspTQPwCqd"],
        enrollmentDate: "LAST_12_MONTHS,THIS_MONTH",
    })
    .getData();
```

#### Run analytics

```ts
const analyticsRunResponse = await api.analytics.run().getData();
```

### Data values

```ts
const response = await api.dataValues
    .postSet({
        dataSet: "Gs69Uw2Mom1",
        orgUnit: "qYIeuQe9OwF",
        period: "202001",
        attributeOptionCombo: "yi2bV1K4vl6",
        dataValues:
            _[
                ({
                    dataElement: "a4bd432446",
                    categoryOptionCombo: "d1bd43245af",
                    value: "1.5",
                },
                {
                    dataElement: "1agd43f4q2",
                    categoryOptionCombo: "aFwdq324132",
                    value: "Some comment",
                })
            ],
    })
    .getData();
```

### Data store

#### Get

```ts
const dataStore = api.dataStore("namespace1");
const value = await dataStore.get("key1").getData();
```

#### Save

```ts
const dataStore = api.dataStore("namespace1");
await dataStore.save("key1", { x: 1, y: 2 });
```

### Tracker

Get all tracked entities for an specific program:

```ts
const data = await api.tracker.trackedEntities
    .get({
        fields: {
            orgUnit: true,
        },
        ouMode: "ALL",
        program: "program_id",
    })
    .getData();
```

Order tracked entities by field/attribute id

```ts
const data = await api.tracker.trackedEntities
    .get({
        fields: {
            orgUnit: true,
        },
        ouMode: "ALL",
        program: "program_id",
        order: [
            { type: "field", field: "createdAt", direction: "asc" },
            { type: "trackedEntityAttributeId", id: "wMhqqPLb7pP", direction: "desc" },
        ],
    })
    .getData();
```

Adding the `totalPages` param will include a pager object:

```ts
const data = await api.tracker.trackedEntities
    .get({
        fields: {
            orgUnit: true,
        },
        ouMode: "ALL",
        program: "program_id",
        totalPages: true,
    })
    .getData();
/* Response:
    {
        page: 1;
        pageSize: 50;
        pageCount: 10;
        total: 500;
    }
    */
```

### Emails

Send a test email:

```ts
await api.email.sendTestMessage().getData();
```

Send a system notification:

```ts
await api.email
    .sendSystemNotification({
        subject: "My subject",
        text: "My message",
    })
    .getData();
```

Send a message (requires role `ALL` or `F_SEND_EMAIL`):

```ts
await api.email
    .sendMessage({
        recipients: ["user@server.org"],
        subject: "My subject",
        text: "My message",
    })
    .getData();
```

## Using type helpers

_d2-api_ exposes some type helpers that you may need in your app. Some examples:

-   `SelectedPick`: Get model from a selector:

```ts
type PartialUser = SelectedPick<
    D2UserSchema,
    {
        id: true;
        favorite: true;
    }
>;
// type PartialUser = {id: string, favorite: boolean}
```

-   `MetadataPick`: Get indexes models from a metadata selector.

```ts
type Metadata = MetadataPick<{
    users: { fields: { id: true; favorite: true } };
    categories: { fields: { id: true; code: true } };
}>;
// type Metadata = {users: {id: string, favorite: boolean}, categories: {id: string, code: string}}
```

## Cancelling requests

The examples use the method `getData()` to resolve the result. That's what we call when we simply want to get the result, but, on the general case, we probably need a cancel object (for example when using cancellable promises/futures, React.useEffect, and so on). An example:

```ts
const { cancel, response } = api.models.dataSets.getById("BfMAe6Itzgt", {
    fields: { id: true, name: true },
});

const res = await response(); // it's a function so the promise resolution can be controlled
console.log("Cancel function", cancel);
console.log(res.data);
```

## Testing

```ts
import { D2Api } from "d2-api/2.36";
import { getMockApiFromClass } from "d2-api";

const currentUserMock = {
    id: "xE7jOejl9FI",
    displayName: "John Traore",
};

const { api, mock } = getMockApiFromClass(D2Api);

describe("Project", () => {
    beforeEach(() => {
        mock.reset();
    });

    describe("getList", () => {
        it("returns list of dataSets filtered", async () => {
            mock.onGet("/me").reply(200, currentUserMock);
            const currentUser = await api.currrentUser.get().getData();
            expect(currentUser.id).toEqual("xE7jOejl9FI");
        });
    });
});
```
