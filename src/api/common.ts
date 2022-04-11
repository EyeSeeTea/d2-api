import _ from "lodash";
import { Ref } from "./../schemas/base";
import { D2ModelSchemaBase, Selector } from "./inference";
import { TaskCategory } from "./system";

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

export type FilterSingleOperatorBase =
    | "eq"
    | "!eq"
    | "ne"
    | "like"
    | "!like"
    | "$like"
    | "!$like"
    | "like$"
    | "!like$"
    | "ilike"
    | "ilike"
    | "$ilike"
    | "!$ilike"
    | "ilike$"
    | "!ilike$"
    | "gt"
    | "ge"
    | "lt"
    | "le"
    | "null"
    | "!null"
    | "empty"
    | "token"
    | "!token";

export type FilterCollectionOperatorBase = "in" | "!in";

export type FilterValueBase = Partial<
    Record<FilterSingleOperatorBase, string> & Record<FilterCollectionOperatorBase, string[]>
>;

export interface FilterBase {
    [property: string]: FilterValueBase | FilterValueBase[] | undefined;
}

function applyFieldTransformers(key: string, value: any) {
    if (value.hasOwnProperty("$fn")) {
        const valueWithFn = _.omit(value, ["$fn"]);

        switch (value["$fn"]["name"]) {
            case "rename":
                return {
                    key: `${key}~rename(${value["$fn"]["to"]})`,
                    value: valueWithFn,
                };
            case "size":
                return {
                    key: `${key}~size`,
                    value: valueWithFn,
                };
            default:
                return { key, value };
        }
    } else {
        return { key, value };
    }
}

export function getFieldsAsString(modelFields: FieldsSelector): string {
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
                    _.map(filter, (value, op) =>
                        isEmptyFilterValue(value)
                            ? null
                            : op === "in" || op === "!in"
                            ? `${field}:${op}:[${(value as string[]).join(",")}]`
                            : `${field}:${op}:${value}`
                    )
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

type IsAny<T> = 0 extends (1 & T) ? true : false;

type IsNever<T> = [T] extends [never] ? true : false;

type IsUnknown<T> = IsNever<T> extends false
    ? T extends unknown
        ? unknown extends T
            ? IsAny<T> extends false
                ? true
                : false
            : false
        : false
    : false;

export type PartialModel<T> = IsUnknown<T> extends true
    ? unknown
    : {
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

export { CancelableResponse as D2ApiResponse } from "../repositories/CancelableResponse";

export type AsyncPostResponse<Type extends TaskCategory> = HttpResponse<{
    name: string;
    id: string;
    created: string;
    jobType: Type;
    relativeNotifierEndpoint: string;
}>;
