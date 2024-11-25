import _ from "lodash";
import {
    AsyncPostResponse,
    D2ApiDefinitionBase,
    D2ApiResponse,
    ErrorReport,
    GetOptionValue,
    MetadataPayloadBase,
    Params,
    processFieldsFilterParams,
    HttpResponse,
} from "./common";
import { D2ApiGeneric, unwrap } from "./d2Api";
import { GetFields, SelectedPick } from "./inference";

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

type RootSelector<D2ApiDefinition extends D2ApiDefinitionBase> = {
    [ModelKey in keyof D2ApiDefinition["schemas"]]?: GetOptionValue<
        D2ApiDefinition,
        D2ApiDefinition["schemas"][ModelKey]
    >;
};

export type MetadataPickBase<
    D2ApiDefinition extends D2ApiDefinitionBase,
    RootSelectorE extends RootSelector<D2ApiDefinition> & any
> = {
    [ModelKey in keyof RootSelectorE & keyof D2ApiDefinition["schemas"]]: Array<
        SelectedPick<D2ApiDefinition["schemas"][ModelKey], GetFields<RootSelectorE[ModelKey]>>
    >;
};

export class Metadata<D2ApiDefinition extends D2ApiDefinitionBase> {
    d2Api: D2ApiGeneric;

    constructor(d2Api: D2ApiGeneric) {
        this.d2Api = d2Api;
    }

    get<
        RootSelectorE extends RootSelector<D2ApiDefinition>,
        Data = MetadataPickBase<D2ApiDefinition, RootSelectorE>
    >(selector: RootSelectorE): D2ApiResponse<Data> {
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
        data: Partial<MetadataPayloadBase<D2ApiDefinition["schemas"]>>,
        options: Partial<PostOptions> = {}
    ): D2ApiResponse<MetadataResponse> {
        return this.d2Api
            .request<MetadataResponse | HttpResponse<MetadataResponse>>({
                method: "post",
                url: "/metadata",
                params: { ...options, async: false } as Params,
                data,
                validateStatus: (status: number) => status >= 200 && status < 300,
            })
            .map(unwrap);
    }

    postAsync(
        data: Partial<MetadataPayloadBase<D2ApiDefinition["schemas"]>>,
        options: Partial<PostOptions> = {}
    ): D2ApiResponse<AsyncPostResponse<"METADATA_IMPORT">> {
        return this.d2Api.request({
            method: "post",
            url: "/metadata",
            params: { ...options, async: true } as Params,
            data,
            validateStatus: (status: number) => status >= 200 && status < 300,
        });
    }
}

export { MetadataPayloadBase };
