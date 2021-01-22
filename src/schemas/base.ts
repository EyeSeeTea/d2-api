import { OmitNever } from "../api/inference";

export type Id = string;

export interface Ref {
    id: Id;
}

export interface D2Access {
    read: boolean;
    update: boolean;
    externalize: boolean;
    delete: boolean;
    write: boolean;
    manage: boolean;
}

type GetDefaultSchema<Model, Name extends string> = {
    name: Name;
    model: Model;
    fields: Model;
    fieldPresets: {
        $all: Preset<Model, keyof Model>;
        $identifiable: Preset<Model, FieldPresets["identifiable"]>;
        $nameable: Preset<Model, FieldPresets["nameable"]>;
        $persisted: Preset<Model, keyof Model>;
        $owner: Preset<Model, keyof Model>;
    };
};

export interface D2Translation {
    property: string;
    locale: string;
    value: string;
}

/*
export interface D2UserGroupAccess {
    access: string;
    userGroupUid: Id;
    displayName: string;
    id: Id;
}

export interface D2UserAccess {
    access: string;
    userUid: Id;
    displayName: string;
    id: Id;
}
*/

export interface D2Style {
    color: string;
    icon: string;
}

export interface D2DimensionalKeywords {
    key: string;
    uid: Id;
    name: string;
    code: string;
}

export type D2Geometry =
    | { type: "Point"; coordinates: [number, number] }
    | { type: "Polygon"; coordinates: Array<Array<[number, number]>> };

export interface D2Expression {
    expression: string;
    description: string;
    missingValueStrategy: "NEVER_SKIP" | "SKIP_IF_ANY_VALUE_MISSING" | "SKIP_IF_ALL_VALUES_MISSING";
    slidingWindow: boolean;
}

export type D2RelationshipConstraint =
    | {
          relationshipEntity: "TRACKED_ENTITY_INSTANCE";
          trackedEntityType: Ref;
          program?: Ref;
      }
    | {
          relationshipEntity: "PROGRAM_INSTANCE";
          program: Ref;
      }
    | {
          relationshipEntity: "PROGRAM_STAGE_INSTANCE";
          program: Ref;
      };

export type D2AccessSchema = GetDefaultSchema<D2Access, "D2Access">;
export type D2TranslationSchema = GetDefaultSchema<D2Translation, "D2Translation">;
export type D2StyleSchema = GetDefaultSchema<D2Style, "D2Style">;
export type D2DimensionalKeywordsSchema = GetDefaultSchema<
    D2DimensionalKeywords,
    "D2DimensionalKeywords"
>;
export type D2GeometrySchema = GetDefaultSchema<D2Geometry, "D2Geometry">;
export type D2ExpressionSchema = GetDefaultSchema<D2Expression, "D2Expression">;
export type D2RelationshipConstraintSchema = GetDefaultSchema<
    D2RelationshipConstraint,
    "D2RelationshipConstraint"
>;

export interface D2Sharing {
    publicAccess: string;
    externalAccess: boolean;
    userAccesses: D2Access[];
    userGroupAccesses: D2Access[];
}

export interface MessageDestination {
    users?: Ref[];
    userGroups?: Ref[];
    organisationUnits?: Ref[];
}

export interface Message extends MessageDestination {
    subject: string;
    text?: string;
}

// 2.33 has removed attributeValue from the schema (why?), so we need to provide it
export type D2AttributeValueGeneric<D2Attribute> = {
    attribute: D2Attribute;
    created: string;
    lastUpdated: string;
    value: string;
};

export type FieldPreset = "$all" | "$identifiable" | "$nameable" | "$persisted" | "$owner";

export interface FieldPresets {
    identifiable: "id" | "name" | "code" | "created" | "lastUpdated";
    nameable: "id" | "name" | "shortName" | "code" | "description" | "created" | "lastUpdated";
}

export type Preset<Model, Properties> = OmitNever<
    {
        [K in Properties & keyof Model]: Model[K] extends Ref
            ? Ref
            : Model[K] extends Array<Ref>
            ? Ref[]
            : Model[K];
    }
>;

export type D2SchemaTypes =
    | "REFERENCE"
    | "BOOLEAN"
    | "TEXT"
    | "DATE"
    | "IDENTIFIER"
    | "URL"
    | "CONSTANT"
    | "INTEGER"
    | "COMPLEX"
    | "PHONENUMBER"
    | "EMAIL"
    | "COLOR"
    | "PASSWORD"
    | "NUMBER"
    | "GEOLOCATION";

export interface SchemaProperty {
    name: string;
    collectionName?: string;
    fieldName?: string;
    propertyType: D2SchemaTypes | "COLLECTION";
    itemPropertyType?: D2SchemaTypes;
    constants?: string[];
    klass: string;
    itemKlass?: string;
    persisted: boolean;
    owner: boolean;
}

export interface D2SchemaFieldProperties {
    name: string;
    fieldName?: string;
    propertyType: D2SchemaTypes | "COLLECTION";
    itemPropertyType?: D2SchemaTypes;
    klass: string;
    itemKlass?: string;
}

export interface D2SchemaProperties {
    klass: string;
    name: string;
    plural: string;
    metadata: boolean;
    displayName: string;
    shareable: boolean;
    relativeApiEndpoint?: string;
    collectionName: string;
    nameableObject: boolean;
    translatable: boolean;
    identifiableObject: boolean;
    dataShareable: boolean;
    persisted: boolean;
    embeddedObject: boolean;
    properties: D2SchemaFieldProperties[];
}
