import { D2SchemaProperties } from "../schemas";
import {
    D2ApiDefinitionBase,
    D2ApiResponse,
    ErrorReport,
    GetOptionValue,
    HttpResponse,
    Params,
    PartialModel,
    PartialPersistedModel,
    processFieldsFilterParams,
} from "./common";
import { D2ApiGeneric, unwrap } from "./d2Api";
import { D2ModelSchemaBase, GetFields, SelectedPick } from "./inference";

type ModelResponse = {
    responseType: "ObjectReport";
    uid: string;
    klass: string;
    errorReports?: ErrorReport[];
};

export interface Pager {
    page: number;
    pageCount: number;
    total: number;
    pageSize: number;
}

export interface NonPaginatedObjects<T> {
    objects: T[];
}

export interface PaginatedObjects<T> extends NonPaginatedObjects<T> {
    pager: Pager;
}

export type GetOptions<
    D2ApiDefinition extends D2ApiDefinitionBase,
    D2ModelSchema extends D2ModelSchemaBase
> = GetOptionValue<D2ApiDefinition, D2ModelSchema> &
    Partial<{
        page: number;
        pageSize: number;
        paging: boolean;
        order: string;
        rootJunction: "AND" | "OR";
    }>;

export interface UpdateOptions {
    preheatCache: boolean;
    strategy: "CREATE_AND_UPDATE" | "CREATE" | "UPDATE" | "DELETE";
    mergeMode: "REPLACE" | "MERGE";
}

export interface GetParams {
    fields?: string;
    filter?: string[];
    pageSize?: number;
    paging?: boolean;
    order?: string;
}

type GetObject<D2ModelSchema extends D2ModelSchemaBase, Options> = SelectedPick<
    D2ModelSchema,
    GetFields<Options>
>;

// At

export class Model<
    D2ApiDefinition extends D2ApiDefinitionBase,
    D2ModelSchema extends D2ModelSchemaBase
> {
    constructor(private d2Api: D2ApiGeneric, public schema: D2SchemaProperties) {}

    get modelName(): D2ModelSchema["name"] {
        return this.schema.plural;
    }

    get<
        Options extends GetOptions<D2ApiDefinition, D2ModelSchema> & { paging?: true | undefined },
        Obj = GetObject<D2ModelSchema, Options>
    >(options: Options): D2ApiResponse<PaginatedObjects<Obj>>;

    get<
        Options extends GetOptions<D2ApiDefinition, D2ModelSchema> & { paging?: false },
        Obj = GetObject<D2ModelSchema, Options>
    >(options: Options): D2ApiResponse<NonPaginatedObjects<Obj>>;

    get<
        Options extends GetOptions<D2ApiDefinition, D2ModelSchema>,
        Obj = GetObject<D2ModelSchema, Options>
    >(
        options: Options
    ): D2ApiResponse<PaginatedObjects<Obj>> | D2ApiResponse<NonPaginatedObjects<Obj>> {
        const paramsFieldsFilter = processFieldsFilterParams(options as any);
        const params = { ...options, ...paramsFieldsFilter } as any;
        const apiResponse = this.d2Api.get<
            {
                [K in D2ModelSchema["name"]]: Obj[];
            } & { pager: Pager }
        >(this.modelName as string, params as Params);

        return apiResponse.map(({ data }) => {
            return {
                ...(options.paging || options.paging === undefined ? { pager: data.pager } : {}),
                objects: data[this.modelName] as Obj[],
            };
        });
    }

    getById<Options extends GetOptions<D2ApiDefinition, D2ModelSchema>>(
        id: string,
        options: Options
    ): D2ApiResponse<GetObject<D2ModelSchema, Options>> {
        type Obj = GetObject<D2ModelSchema, Options>;

        const paramsFieldsFilter = processFieldsFilterParams(options as any);
        const params = { ...options, ...paramsFieldsFilter };

        return this.d2Api.get<Obj>(`/${this.modelName}/${id}`, params);
    }

    post(
        payload: PartialModel<D2ModelSchema["model"]>,
        options?: Partial<UpdateOptions>
    ): D2ApiResponse<ModelResponse> {
        return this.d2Api
            .post<ModelResponse | HttpResponse<ModelResponse>>(
                this.modelName,
                (options || {}) as Params,
                payload as object
            )
            .map(unwrap);
    }

    put(
        payload: PartialPersistedModel<D2ModelSchema["model"]>,
        options?: Partial<UpdateOptions>
    ): D2ApiResponse<ModelResponse> {
        return this.d2Api
            .put<ModelResponse | HttpResponse<ModelResponse>>(
                [this.modelName, payload.id].join("/"),
                (options || {}) as Params,
                payload
            )
            .map(unwrap);
    }

    delete(payload: PartialPersistedModel<D2ModelSchema["model"]>): D2ApiResponse<ModelResponse> {
        return this.d2Api
            .delete<ModelResponse | HttpResponse<ModelResponse>>(`/${this.modelName}/${payload.id}`)
            .map(unwrap);
    }
}
