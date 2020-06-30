import { Ref } from "./../schemas/base";
import _ from "lodash";
import { Selector, D2ModelSchemaBase } from "./inference";

export { D2ApiResponse } from "./api-response";

export interface GetOptionValue<
    D2ApiDefinition extends D2ApiDefinitionBase,
    D2ModelSchema extends D2ModelSchemaBase
> {
    fields: Selector<D2ModelSchema>;
    filter?: D2ApiDefinition["filter"];
}

export type MetadataPayloadBase<D2ModelSchemas extends D2ModelSchemasBase> = {
    [K in keyof D2ModelSchemas]: Array<PartialModel<D2ModelSchemas[K]["model"]>>;
};

type FieldsSelector = object;

const arrayOperators = ["in", "!in"] as const;
const unaryOperators = ["null", "!null", "empty"] as const;
const valueOperators = [
    "eq",
    "!eq",
    "ne",
    "like",
    "!like",
    "$like",
    "!$like",
    "like$",
    "!like$",
    "ilike",
    "ilike",
    "$ilike",
    "!$ilike",
    "ilike$",
    "!ilike$",
    "gt",
    "ge",
    "lt",
    "le",
    "token",
    "!token",
] as const;

export type FilterValueOperator = (typeof valueOperators)[number];

export type FilterArrayOperator = (typeof arrayOperators)[number];

export type FilterUnaryOperator = (typeof unaryOperators)[number];

export type FilterValue = Partial<
    Record<FilterValueOperator, string> &
        Record<FilterArrayOperator, string[]> &
        Record<FilterUnaryOperator, null | true>
>;

export interface FilterBase {
    [property: string]: FilterValue | FilterValue[] | undefined;
}

function applyFieldTransformers(key: string, value: any) {
    if (value.hasOwnProperty("$fn")) {
        switch (value["$fn"]["name"]) {
            case "rename":
                return {
                    key: `${key}~rename(${value["$fn"]["to"]})`,
                    value: _.omit(value, ["$fn"]),
                };
            default:
                return { key, value };
        }
    } else {
        return { key, value };
    }
}

function getFieldsAsString(modelFields: FieldsSelector): string {
    return _(modelFields)
        .map((value0, key0: string) => {
            const { key, value } = applyFieldTransformers(key0, value0);

            if (typeof value === "boolean" || _.isEqual(value, {})) {
                return value ? key.replace(/^\$/, ":") : null;
            } else {
                return key + "[" + getFieldsAsString(value) + "]";
            }
        })
        .compact()
        .sortBy()
        .join(",");
}

function toArray<T>(itemOrItems: T | T[]): T[] {
    return Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems];
}

function getFilterAsString(filter: FilterBase): string[] {
    return _.sortBy(
        _.flatMap(filter, (filterOrFilters, field) =>
            _.flatMap(toArray(filterOrFilters || []), filter =>
                _.compact(
                    _.map(filter, (value, op) => {
                        if (_.includes(arrayOperators, op) && value) {
                            return `${field}:${op}:[${(value as string[]).join(",")}]`;
                        } else if (_.includes(unaryOperators, op)) {
                            return `${field}:${op}`;
                        } else if (_.includes(valueOperators, op) && !isEmptyFilterValue(value)) {
                            return `${field}:${op}:${value}`;
                        } else {
                            return null;
                        }
                    })
                )
            )
        )
    );
}

export interface GetOptionGeneric {
    fields: FieldsSelector;
    filter: FilterBase;
}

function isEmptyFilterValue(val: any): boolean {
    return val === undefined || val === null || val === "";
}

export function processFieldsFilterParams(
    modelOptions: GetOptionGeneric,
    modelName?: string
): _.Dictionary<any> {
    const join = (s: string) => _.compact([modelName, s]).join(":");

    return _.pickBy({
        [join("fields")]: modelOptions.fields && getFieldsAsString(modelOptions.fields),
        [join("filter")]: modelOptions.filter && getFilterAsString(modelOptions.filter),
    });
}

export interface D2Response<Data> {
    status: number;
    data: Data;
    headers: _.Dictionary<string>;
}

export type D2ApiRequestParamsValue = string | number | boolean | undefined;

export interface Params {
    [key: string]: D2ApiRequestParamsValue | D2ApiRequestParamsValue[];
}

export interface ErrorReport {
    message: string;
    mainKlass: string;
    errorKlass: string;
    errorProperty: string;
    errorCode: string;
}

export interface HttpResponse<Response> {
    httpStatus: "OK" | "Conflict";
    httpStatusCode: number;
    status: "OK" | "ERROR";
    message?: string;
    response: Response;
}

export type PartialModel<T> = {
    [P in keyof T]?: T[P] extends (infer U)[]
        ? PartialModel<U>[]
        : T[P] extends object
        ? PartialModel<T[P]>
        : T[P];
};

export type PartialPersistedModel<T> = PartialModel<T> & Ref;

export type D2ModelSchemasBase = Record<string, D2ModelSchemaBase>;

export interface D2ApiDefinitionBase {
    schemas: D2ModelSchemasBase;
    filter: Record<string, any>;
}
