import { D2ApiGeneric } from "./api/d2Api";
import MockAdapter from "axios-mock-adapter";
import { D2Api } from "./2.43";

export type D2ApiMock = MockAdapter;

export function getMockApiFromClass<D2Api extends D2ApiGeneric>(apiClass: {
    new (): D2Api;
}): () => { api: D2Api; mock: MockAdapter } {
    return () => {
        const api = new apiClass();
        const mock = api.getMockAdapter();
        return { api, mock };
    };
}

export const playFixtures = {
    baseUrl: "https://play.im.dhis2.org/stable-2-43-0",
    auth: { username: "admin", password: "district" },
    program: "IpHINAT79UW",
    trackedEntityType: "nEenWmSyUEp",
    orgUnit: "DiszpKrYNg8",
} as const;

export function getPlayD2Api(): D2Api {
    return new D2Api({
        baseUrl: playFixtures.baseUrl,
        auth: playFixtures.auth,
        backend: "fetch",
    });
}
