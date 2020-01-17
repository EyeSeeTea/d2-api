import { D2ModelSchemas } from "./../schemas/models";
import _ from "lodash";
import {
    processFieldsFilterParams,
    Params,
    ErrorReport,
    D2ApiResponse,
    GetOptionValue,
    MetadataPayload,
} from "./common";
import { D2Api } from "./d2-api";
import { SelectedPick, GetFields } from "./inference";

export interface PostOptions {
    importMode: "COMMIT" | "VALIDATE";
    identifier: "UID" | "CODE" | "AUTO";
    importReportMode: "ERRORS" | "FULL" | "DEBUG";
    preheatMode: "REFERENCE" | "ALL" | "NONE";
    importStrategy: "CREATE_AND_UPDATE" | "CREATE" | "UPDATE" | "DELETE";
    atomicMode: "ALL" | "NONE";
    mergeMode: "MERGE" | "REPLACE";
    flushMode: "AUTO" | "OBJECT";
    skipSharing: boolean;
    skipValidation: boolean;
    async: boolean;
    inclusionStrategy: "NON_NULL" | "ALWAYS" | "NON_EMPTY";
    userOverrideMode: "NONE" | "CURRENT" | "SELECTED";
    overrideUser: string;
}

export interface Stats {
    created: number;
    updated: number;
    deleted: number;
    ignored: number;
    total: number;
}

export interface MetadataResponse {
    importParams: PostOptions;
    status: "OK" | "ERROR";
    stats: Stats;
    typeReports: TypeReport[];
}

export interface ObjectReport {
    klass: string;
    index: number;
    uid: string;
    errorReports: ErrorReport[];
}

export interface TypeReport {
    klass: string;
    stats: Stats;
    objectReports: ObjectReport[];
}

type RootSelector = {
    [ModelKey in keyof D2ModelSchemas]?: GetOptionValue<ModelKey>;
};

export type MetadataPick<RootSelectorE extends RootSelector> = {
    [ModelKey in keyof RootSelectorE & keyof D2ModelSchemas]: Array<
        SelectedPick<D2ModelSchemas[ModelKey], GetFields<RootSelectorE[ModelKey]>>
    >;
};

export default class D2ApiMetadata {
    d2Api: D2Api;

    constructor(d2Api: D2Api) {
        this.d2Api = d2Api;
    }

    get<RootSelectorE extends RootSelector, Data = MetadataPick<RootSelectorE>>(
        selector: RootSelectorE
    ): D2ApiResponse<Data> {
        const metadataOptions = _(selector)
            .map((modelOptions, modelName) =>
                processFieldsFilterParams(modelOptions as any, modelName)
            )
            .reduce(_.merge, {});
        const apiResponse = this.d2Api.get<Data>("/metadata", metadataOptions);

        return apiResponse.map(({ data }) => {
            return _(selector)
                .mapValues(() => [])
                .merge(data)
                .value();
        });
    }

    post(
        data: Partial<MetadataPayload>,
        options?: Partial<PostOptions>
    ): D2ApiResponse<MetadataResponse> {
        return this.d2Api.request({
            method: "post",
            url: "/metadata",
            params: (options || {}) as Params,
            data,
            validateStatus: (status: number) => status >= 200 && status < 300,
        });
    }
}