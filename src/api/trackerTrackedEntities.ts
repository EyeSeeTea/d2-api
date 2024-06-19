import _ from "lodash";
import { D2Geometry, FieldPresets, Preset } from "../schemas";
import { Id, Selector } from "./base";
import { D2ApiResponse, getFieldsAsString } from "./common";
import { D2ApiGeneric } from "./d2Api";
import { D2TrackerEnrollment } from "./trackerEnrollments";
import { Maybe } from "../utils/types";

export class TrackedEntities {
    constructor(public d2Api: D2ApiGeneric) {}

    get<Fields extends D2TrackerTrackedEntityFields>(
        params: TrackerTrackedEntitiesParams<Fields>
    ): D2ApiResponse<TrackedEntitiesGetResponse> {
        const { fields, order, ...rest } = params;
        const orderParam = this.buildOrderParams(order);
        const paramsToRequest = { ...rest, order: orderParam };
        return this.d2Api.get<TrackedEntitiesGetResponse>("/tracker/trackedEntities", {
            ...paramsToRequest,
            fields: getFieldsAsString(fields),
        });
    }

    private buildOrderParams(order: Maybe<TrackedOrderBase[]>): Maybe<string> {
        if (!order || order.length === 0) return undefined;

        const orderValue = _(order)
            .map(orderTracked => {
                if (orderTracked.type === "field") {
                    return `${orderTracked.field}:${orderTracked.direction}`;
                } else if (orderTracked.type === "id") {
                    return `${orderTracked.id}:${orderTracked.direction}`;
                } else {
                    return undefined;
                }
            })
            .compact()
            .join(",");

        return orderValue;
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
    geometry?: Extract<D2Geometry, { type: "Point" }>;
}

interface GeometryPolygon {
    geometry?: Extract<D2Geometry, { type: "Polygon" }>;
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
    | ({ ouMode: "ALL" } & PartialParams)
    | (Pick<TrackedEntitiesParamsBase, "programStatus" | "program"> & PartialParams)
    | (Pick<TrackedEntitiesParamsBase, "followUp" | "program"> & PartialParams)
    | (Pick<TrackedEntitiesParamsBase, "enrollmentEnrolledAfter" | "program"> & PartialParams)
    | (Pick<TrackedEntitiesParamsBase, "enrollmentEnrolledBefore" | "program"> & PartialParams);

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
    trackedEntity: SemiColonDelimitedListOfUid;
    assignedUserMode: "CURRENT" | "PROVIDED" | "NONE" | "ANY";
    assignedUser: SemiColonDelimitedListOfUid;
    eventStatus: "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULE" | "OVERDUE" | "SKIPPED";
    eventOccurredAfter: IsoDate;
    eventOccurredBefore: IsoDate;
    skipMeta: boolean;
    includeDeleted: boolean;
    includeAllAttributes: boolean;
    potentialDuplicate: boolean;
    order: TrackedOrderBase[];
};

export type TrackedOrderBase = {
    direction: "asc" | "desc";
} & (TrackedOrderFields | TrackedAttributesFields);

export type TrackedOrderFields = {
    type: "field";
    field:
        | "createdAtClient"
        | "createdAt"
        | "enrolledAt"
        | "inactive"
        | "trackedEntity"
        | "updatedAt";
};

export type TrackedAttributesFields = { type: "id"; id: Id };

export interface TrackedEntitiesGetResponse {
    page: number;
    pageSize: number;
    instances: D2TrackerTrackedEntity[];
    // total and pageCount: Only if requested with totalPages=true
    total?: number;
    pageCount?: number;
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
