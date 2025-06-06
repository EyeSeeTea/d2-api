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
