import { FieldPreset, Ref } from "./../schemas/base";

/* Generic Helpers */

type If<Condition, Then, Else> = Condition extends true ? Then : Else;

type IsLiteral<T> = T extends object ? false : true;

type RejectByValue<Base, Value> = { [Key in keyof Base]: Base[Key] extends Value ? never : Key };

type RejectedKeys<Base, Value> = RejectByValue<Base, Value>[keyof Base];

type OmitByValue<Base, Value> = Pick<Base, RejectedKeys<Base, Value>>;

export type OmitNever<T> = OmitByValue<T, never>;

/* Selector helpers:

    https://docs.dhis2.org/2.30/en/developer/html/dhis2_developer_manual_full.html#webapi_field_transformers

    https://docs.dhis2.org/2.30/en/developer/html/dhis2_developer_manual_full.html#webapi_metadata_field_filter

*/

export type Selector<ModelSchema extends D2ModelSchemaBase> = {
    [Key in keyof ModelSchema["fields"]]?:
        | boolean
        | object
        | If<
              IsLiteral<ModelSchema["fields"][Key]>,
              boolean, // TODO: functions
              ModelSchema["fields"][Key] extends Array<infer T>
                  ? (
                        | boolean
                        | (T extends D2ModelSchemaBase ? Selector<T> : never)) /* | functions | */
                  : ModelSchema["fields"][Key] extends D2ModelSchemaBase
                  ? Selector<ModelSchema["fields"][Key]>
                  : ModelSchema["fields"][Key]
          >;
} &
    {
        [K in FieldPreset]?: boolean;
    };

export type ValidateSameKeys<SM, ModelSelector> = Exclude<
    keyof SM,
    keyof ModelSelector
> extends never
    ? ModelSelector
    : { error: "Unknown keys in selector"; keys: Exclude<keyof SM, keyof ModelSelector> };

export type SelectedPickValidated<
    Model extends D2ModelSchemaBase,
    SM
> = SM extends ValidateSameKeys<SM, Selector<Model>> ? SelectedPick<Model, SM> : never;

export interface D2ModelSchemaBase {
    name: string;
    model: object;
    fields: { [s: string]: any };
    fieldPresets: {
        [FieldPresetK in FieldPreset]: { [s: string]: any };
    };
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((
    k: infer I
) => void)
    ? I
    : never;

export type SelectedPick<
    Schema extends D2ModelSchemaBase,
    SchemaSelector extends Selector<Schema>
> = UnionToIntersection<Schema["fieldPresets"][keyof SchemaSelector & FieldPreset]> &
    SelectedPickFields<Schema, SchemaSelector>;

type GetValues<T> = UnionToIntersection<T[keyof T]>;

type SelectorKey<
    Model extends D2ModelSchemaBase,
    ModelSelector,
    K extends keyof ModelSelector & keyof Model["fields"]
> = ModelSelector[K] extends object
    ? Model["fields"][K] extends Array<infer T>
        ? T extends D2ModelSchemaBase
            ? SelectedPickValidated<T, ModelSelector[K]>[]
            : T[]
        : (Model["fields"][K] extends D2ModelSchemaBase
              ? SelectedPickValidated<Model["fields"][K], ModelSelector[K]>
              : Model["fields"][K])
    : ModelSelector[K] extends true
    ? (IsLiteral<Model["fields"][K]> extends true
          ? Model["fields"][K]
          : GetTrueSelectionOnNonLiteral<Model["fields"][K]>)
    : never;

type GetTrueSelectionOnNonLiteral<SchemaValue> = SchemaValue extends Array<infer T>
    ? (T extends { fieldPresets: any } ? Ref[] : T[])
    : SchemaValue extends { fieldPresets: any }
    ? Ref
    : SchemaValue;

type Function = {
    rename: { name: "rename"; to: string };
    size: { name: "size" };
};

export type SelectedPickFields<
    Model extends D2ModelSchemaBase,
    ModelSelector extends Selector<Model>
> = GetValues<
    {
        [Key in keyof ModelSelector & keyof Model["fields"]]: ModelSelector[Key] extends {
            $fn: Function[keyof Function];
        }
            ? ApplyFunction<Model, ModelSelector, Key>
            : {
                  [K in Key]: SelectorKey<Model, ModelSelector, K>;
              };
    }
>;

type ApplyFunction<
    Model extends D2ModelSchemaBase,
    ModelSelector extends Selector<Model>,
    Key extends keyof ModelSelector & keyof Model["fields"]
> = ModelSelector[Key] extends {
    $fn: Function["rename"];
}
    ? {
          [K in ModelSelector[Key]["$fn"]["to"]]: SelectorKey<Model, ModelSelector, Key>;
      }
    : ModelSelector[Key] extends {
          $fn: Function["size"];
      }
    ? {
          [K in Key]: number;
      }
    : never;

export type Get<Obj, Key> = Key extends keyof Obj ? Obj[Key] : never;

export type GetFields<Obj> = Get<Obj, "fields">;
