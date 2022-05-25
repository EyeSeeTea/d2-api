import { D2ApiResponse, HttpResponse, validate2xx, validate404 } from "./common";
import { HttpResponse as HttpClientResponse } from "../repositories/HttpClientRepository";
import { D2ApiGeneric } from "./d2Api";

type UpdateResponse = HttpResponse<undefined>;

export class DataStore {
    private endpoint: string;

    constructor(public d2Api: D2ApiGeneric, type: DataStoreType, public namespace: string) {
        this.endpoint = type === "user" ? "userDataStore" : "dataStore";
    }

    getKeys(): D2ApiResponse<string[]> {
        const { d2Api, namespace } = this;

        return d2Api
            .request<string[]>({
                method: "get",
                url: `/${this.endpoint}/${namespace}`,
                validateStatus: validate404,
            })
            .map(response => (response.status === 404 ? [] : response.data));
    }

    get<T>(key: string): D2ApiResponse<T | undefined> {
        const { d2Api, namespace } = this;

        return d2Api
            .request<T>({
                method: "get",
                url: `/${this.endpoint}/${namespace}/${key}`,
                validateStatus: validate404,
            })
            .map(response => (response.status === 404 ? undefined : response.data));
    }

    getMetadata(key: string): D2ApiResponse<DataStoreKeyMetadata | undefined> {
        const { d2Api, namespace } = this;

        return d2Api
            .request<DataStoreKeyMetadata>({
                method: "get",
                url: `/${this.endpoint}/${namespace}/${key}/metaData`,
                validateStatus: validate404,
            })
            .map(response => (response.status === 404 ? undefined : response.data));
    }

    save(key: string, value: object): D2ApiResponse<void> {
        const { d2Api, namespace } = this;
        const config = { url: `/${this.endpoint}/${namespace}/${key}`, data: value };

        return d2Api
            .request<UpdateResponse>({
                method: "put",
                ...config,
                validateStatus: validate404,
            })
            .flatMap(response => {
                if (response.status === 404) {
                    return d2Api
                        .request<UpdateResponse>({ method: "post", ...config })
                        .map(validateResponse);
                } else {
                    const voidResponse = { ...response, data: validateResponse(response) };
                    return D2ApiResponse.build({ response: () => Promise.resolve(voidResponse) });
                }
            });
    }

    delete(key: string): D2ApiResponse<boolean> {
        const { d2Api, namespace } = this;

        return d2Api
            .request<UpdateResponse>({
                method: "delete",
                url: `/${this.endpoint}/${namespace}/${key}`,
                validateStatus: validate404,
            })
            .map(response => (response.status === 404 ? false : response.data.status === "OK"));
    }
}

function validateResponse(response: HttpClientResponse<HttpResponse<unknown>>): undefined {
    const { data } = response;
    if (validate2xx(response.status) && data.status === "OK") {
        return;
    } else {
        throw new Error(data.message || "Invalid response from server");
    }
}

export type DataStoreType = "global" | "user";

export interface DataStoreKeyMetadata {
    created: Date;
    user: { id: string };
    lastUpdated: Date;
    lastUpdatedBy: { id: string };
    namespace: string;
    key: string;
    value: string;
    favorite: boolean;
    id: string;
    publicAccess: string;
    externalAccess: boolean;
    userAccesses: SharingSetting[];
    userGroupAccesses: SharingSetting[];
}

interface SharingSetting {
    access: string;
    displayName: string;
    id: string;
}
