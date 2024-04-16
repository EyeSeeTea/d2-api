import _ from "lodash";
import { D2Geometry, FieldPresets, Preset } from "../schemas";
import { Id, Selector } from "./base";
import { D2ApiResponse, getFieldsAsString } from "./common";
import { D2ApiGeneric } from "./d2Api";
import { D2TrackerEnrollment } from "./trackerEnrollments";

export class TrackedEntities {
    constructor(public d2Api: D2ApiGeneric) {}

    get<Fields extends D2TrackerTrackedEntityFields>(
        params: TrackerTrackedEntitiesParams<Fields>
    ): D2ApiResponse<TrackedEntitiesGetResponse> {
        return this.d2Api.get<TrackedEntitiesGetResponse>("/tracker/trackedEntities", {
            ..._.omit(params, ["fields"]),
            fields: getFieldsAsString(params.fields),
        });
    }
}

type ProgramStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
type IsoDate = string;
type SemiColonDelimitedListOfUid = string;
type CommaDelimitedListOfUid = string;
type CommaDelimitedListOfAttributeFilter = string;

interface D2TrackerTrackedEntityBase {
    trackedEntity?: Id;
    trackedEntityType?: Id;
    createdAt?: IsoDate;
    createdAtClient?: IsoDate;
    updatedAt?: IsoDate;
    orgUnit?: SemiColonDelimitedListOfUid;
    inactive?: boolean;
    deleted?: boolean;
    relationships?: Relationship[];
    attributes?: Attribute[];
    enrollments?: D2TrackerEnrollment[];
    programOwners?: ProgramOwner[];
}

export type D2TrackerTrackedEntity = TrackedEntityGeometryPoint | TrackedEntityGeometryPolygon;

interface GeometryPoint {
    geometry?: Extract<D2Geometry, { type: "Point" }> | null;
}

interface GeometryPolygon {
    geometry?: Extract<D2Geometry, { type: "Polygon" }> | null;
}

type TrackedEntityGeometryPoint = D2TrackerTrackedEntityBase & GeometryPoint;

type TrackedEntityGeometryPolygon = D2TrackerTrackedEntityBase & GeometryPolygon;

interface ProgramOwner {
    orgUnit: Id;
    program: Id;
    trackedEntity: Id;
}

export interface Relationship {
    relationship: Id;
    relationshipType: Id;
    relationshipName: string;
    from: RelationshipItem;
    to: RelationshipItem;
}

export interface RelationshipItem {
    trackedEntity?: {
        trackedEntity: Id;
    };
    event?: { event: Id };
}

export interface AttributeValue {
    attribute: Attribute;
    value: string;
    optionId?: Id;
}

export interface Attribute {
    attribute: Id;
    valueType?: string;
    value: string;
}

type TrackerTrackedEntitiesParams<Fields> = Params & { fields: Fields } & Partial<{
        totalPages: boolean;
        page: number;
        pageSize: number;
        skipPaging: boolean;
    }>;

type Params =
    | ({ orgUnit: SemiColonDelimitedListOfUid } & PartialParams)
    | ({ ouMode: "ALL" } & PartialParams);

type PartialParams = Partial<TrackedEntitiesParamsBase>;

export type TrackedEntitiesParamsBase = {
    query: string;
    attribute: CommaDelimitedListOfUid;
    filter: CommaDelimitedListOfAttributeFilter;
    orgUnit: SemiColonDelimitedListOfUid;
    ouMode: "SELECTED" | "CHILDREN" | "DESCENDANTS" | "ACCESSIBLE" | "CAPTURE" | "ALL";
    program: Id;
    programStatus: ProgramStatus;
    programStage: Id;
    followUp: boolean;
    updatedAfter: IsoDate;
    updatedBefore: IsoDate;
    updatedWithin: IsoDate;
    enrollmentEnrolledAfter: IsoDate;
    enrollmentEnrolledBefore: IsoDate;
    enrollmentOccurredAfter: IsoDate;
    enrollmentOccurredBefore: IsoDate;
    trackedEntityType: Id;
    trackedEntities: SemiColonDelimitedListOfUid;
    assignedUserMode: "CURRENT" | "PROVIDED" | "NONE" | "ANY";
    assignedUsers: CommaDelimitedListOfUid;
    eventStatus: "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULE" | "OVERDUE" | "SKIPPED";
    eventOccurredAfter: IsoDate;
    eventOccurredBefore: IsoDate;
    skipMeta: boolean;
    includeDeleted: boolean;
    includeAllAttributes: boolean;
    potentialDuplicate: boolean;
};

export interface TrackedEntitiesGetResponse {
    page: number;
    pageSize: number;
    instances: D2TrackerTrackedEntity[];
    total?: number; // Only if requested with totalPages=true
}

export interface D2TrackerTrackedEntitySchema {
    name: "D2TrackerTrackedEntity";
    model: D2TrackerTrackedEntity;
    fields: D2TrackerTrackedEntity;
    fieldPresets: {
        $all: Preset<D2TrackerTrackedEntity, keyof D2TrackerTrackedEntity>;
        $identifiable: Preset<D2TrackerTrackedEntity, FieldPresets["identifiable"]>;
        $nameable: Preset<D2TrackerTrackedEntity, FieldPresets["nameable"]>;
        $persisted: Preset<D2TrackerTrackedEntity, never>;
        $owner: Preset<D2TrackerTrackedEntity, never>;
    };
}

type D2TrackerTrackedEntityFields = Selector<D2TrackerTrackedEntitySchema>;
