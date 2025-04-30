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

An example for 2.32:

```ts
import { D2Api } from "d2-api/2.32";

const api = new D2Api({
    baseUrl: "https://play.dhis2.org/2.30",
    auth: { username: "admin", password: "district" },
    timeout: 60 * 1000,
});
```

### Metadata models

#### GET (list)

```ts
const { cancel, response } = api.models.dataSets.get({
    fields: {
        id: true,
        name: true,
        categoryOptions: {
            id: true,
            name: true,
        },
    },
    filter: {
        name: { ilike: "health", "!in": ["Child Health"] },
        code: { $like: "DS_" },
    },
    order: "name:asc",
    paging: false,
});

console.log({ cancel, data: (await response).data.objects[0].name });
```

#### POST (create)

```ts
const { cancel, response } = api.models.dataSets.post({
    name: "My DataSet",
    periodType: "Monthly",
});
```

#### PUT (update)

```ts
const { cancel, response } = api.models.dataSets.put({
    id: "Ew82BhPZkpa",
    name: "My DataSet",
    periodType: "Daily",
});
```

#### DELETE (delete)

```ts
const { cancel, response } = api.models.dataSets.delete({
    id: "Ew82BhPZkpa",
});
```

### Metadata

#### GET

```ts
const { cancel, response } = api.metadata.get({
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
});

const { dataSets, categories } = (await response).data;
```

#### POST

```ts
const { cancel, response } = api.metadata.post({
    dataSets: [
        {
            name: "My DataSet",
            periodType: "Monthly",
        },
    ],
});

console.log((await response).data);
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

```
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
dataStore.save("key1", { x: 1, y: 2 });
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

console.log(data.instances);
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

console.log(data.instances);
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

console.log(data.pager);
/*
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

## Testing

```ts
import { D2Api } from "d2-api/2.32";
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
