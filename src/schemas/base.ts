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

export interface D2AccessData {
    read: boolean;
    write: boolean;
}

export interface D2AccessWithData extends D2Access {
    data: D2AccessData;
}

type GetDefaultSchema<Model> = {
    fields: Model;
    fieldPresets: {
        $all: keyof Model;
        $identifiable: FieldPresets["identifiable"];
        $nameable: FieldPresets["nameable"];
        $persisted: keyof Model;
        $owner: keyof Model;
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

export type D2Coordinates = [number, number];

export type D2Geometry =
    | { type: "Point"; coordinates: D2Coordinates }
    | { type: "Polygon"; coordinates: Array<D2Coordinates[]> }
    | { type: "MultiPolygon"; coordinates: Array<Array<D2Coordinates[]>> };

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
      }
    | {
          relationshipEntity: "PROGRAM_STAGE_INSTANCE";
          programStage: Ref;
      };

export type D2AccessSchema = GetDefaultSchema<D2Access>;
export type D2TranslationSchema = GetDefaultSchema<D2Translation>;
export type D2StyleSchema = GetDefaultSchema<D2Style>;
export type D2DimensionalKeywordsSchema = GetDefaultSchema<D2DimensionalKeywords>;
export type D2GeometrySchema = GetDefaultSchema<D2Geometry>;
export type D2ExpressionSchema = GetDefaultSchema<D2Expression>;

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

/* 2.36 has moved plain access fields from models to sharing key */

type Access = string;

interface IdAccess {
    id: Id;
    access: Access;
}

export interface Sharing {
    owner: Id;
    public: Access;
    users: Record<Id, IdAccess>;
    userGroups: Record<Id, IdAccess>;
    external: boolean;
}

/* 2.33 has removed attributeValue from the schema (why?), so we need to provide a model and schema */

export type D2AttributeValueGeneric<D2Attribute> = {
    attribute: D2Attribute;
    created: string;
    lastUpdated: string;
    value: string;
};

export interface D2AttributeValueGenericSchema<D2Attribute, D2AttributeSchema> {
    name: "D2AttributeValue";
    model: D2AttributeValueGeneric<D2Attribute>;
    fields: { attribute: D2AttributeSchema; created: string; lastUpdated: string; value: string };
    fieldPresets: {
        $all: Preset<
            D2AttributeValueGeneric<D2Attribute>,
            keyof D2AttributeValueGeneric<D2Attribute>
        >;
        $identifiable: Preset<D2AttributeValueGeneric<D2Attribute>, FieldPresets["identifiable"]>;
        $nameable: Preset<D2AttributeValueGeneric<D2Attribute>, FieldPresets["nameable"]>;
        $persisted: Preset<
            D2AttributeValueGeneric<D2Attribute>,
            "lastUpdated" | "attribute" | "value" | "created"
        >;
        $owner: Preset<
            D2AttributeValueGeneric<D2Attribute>,
            "lastUpdated" | "attribute" | "value" | "created"
        >;
    };
}

export type FieldPreset = "$all" | "$identifiable" | "$nameable" | "$persisted" | "$owner";

export interface FieldPresets {
    identifiable: "id" | "name" | "code" | "created" | "lastUpdated" | "href";
    nameable:
        | "id"
        | "name"
        | "shortName"
        | "code"
        | "description"
        | "created"
        | "lastUpdated"
        | "href";
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

export interface D2ReportingParams {
    reportingPeriod: boolean;
    grandParentOrganisationUnit: boolean;
    parentOrganisationUnit: boolean;
    organisationUnit: boolean;
}

export interface D2Axis {
    dimensionalItem: string;
    axis: number;
}

export interface D2ProgramOwner {
    ownerOrgUnit: Id;
    program: Id;
    trackedEntityInstance: Id;
}

export type D2ProgramOwnerSchema = GetDefaultSchema<D2ProgramOwner>;
