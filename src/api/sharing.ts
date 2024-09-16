import { D2ApiGeneric } from "./d2Api";
import { D2ApiResponse } from "./common";
import { PartialBy } from "../utils/types";

/* https://docs.dhis2.org/master/en/developer/html/webapi_sharing.html */

export class Sharing {
    constructor(public d2Api: D2ApiGeneric) {}

    search(options: SearchOptions): D2ApiResponse<SearchResponse> {
        return this.d2Api.get<SearchResponse>("/sharing/search", options);
    }

    get(params: SharingParams): D2ApiResponse<SharingGetResponse> {
        return this.d2Api.get<SharingGetResponse>("/sharing", params);
    }

    post(params: SharingParams, object: SharingObjectUpdate): D2ApiResponse<void> {
        return this.d2Api.post<void>("/sharing", params, { object });
    }
}

export type SearchOptions = {
    key: string;
    pageSize?: number;
};

export type SharingParams = {
    type: string;
    id: string;
};

export interface SharingGetResponse {
    meta: { allowPublicAccess: boolean; allowExternalAccess: boolean };
    object: {
        id: string;
        name: string;
        displayName: string;
        publicAccess: string;
        externalAccess: boolean;
        userAccesses?: SharingSetting[];
        userGroupAccesses?: SharingSetting[];
        user: {
            id: string;
            name: string;
        };
    };
}

export interface SharingObjectUpdate {
    publicAccess?: string;
    externalAccess?: boolean;
    userAccesses?: PartialBy<SharingSetting, "name" | "displayName">[];
    userGroupAccesses?: PartialBy<SharingSetting, "name" | "displayName">[];
}

interface SharingSetting {
    id: string;
    access: string;
    displayName: string;
    name: string;
}

export interface SearchResponse {
    users: Array<{
        id: string;
        displayName: string;
        name: string;
    }>;
    userGroups: Array<{
        id: string;
        displayName: string;
        name: string;
    }>;
}
