import _ from "lodash";
import { D2Geometry, Preset } from "../schemas";
import { Id, Selector, SelectedPick } from "./base";
import { D2ApiResponse } from "./common";
import { D2ApiGeneric } from "./d2Api";
import {
    D2TrackerEnrollment,
    D2TrackerEnrollmentSchema,
    D2TrackerEnrollmentToPost,
} from "./trackerEnrollments";
import { RequiredBy, Maybe, RequireAtLeastOne } from "../utils/types";
import { getTrackerFieldsParam } from "./tracker";

export class TrackedEntities {
    constructor(public d2Api: D2ApiGeneric) {}

    get<Fields extends D2TrackerTrackedEntityFields>(
        params: TrackerTrackedEntitiesParams<Fields>
    ): D2ApiResponse<TrackedEntitiesGetResponse<Fields>> {
        const { fields, order, ...rest } = params;
        const orderParam = this.buildOrderParams(order);
        const paramsToRequest = { ...rest, order: orderParam };

        return this.d2Api
            .get<TrackerResponse<Fields>>("/tracker/trackedEntities", {
                ...paramsToRequest,
                fields: getTrackerFieldsParam(fields),
            })
            .map(response => {
                return {
                    pager: response.data.pager,
                    trackedEntities: response.data.trackedEntities,
                };
            });
    }

    private buildOrderParams(order: Maybe<TrackedOrderBase[]>): Maybe<string> {
        if (!order || order.length === 0) return undefined;

        const orderValue = _(order)
            .map(orderTracked => {
                if (orderTracked.type === "field") {
                    return `${orderTracked.field}:${orderTracked.direction}`;
                } else if (orderTracked.type === "trackedEntityAttributeId") {
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
    trackedEntity: Id;
    trackedEntityType: Id;
    createdAt: IsoDate;
    createdAtClient: IsoDate;
    updatedAt: IsoDate;
    updatedAtClient: IsoDate;
    orgUnit: SemiColonDelimitedListOfUid;
    inactive: boolean;
    deleted: boolean;
    relationships: Relationship[];
    attributes: Attribute[];
    enrollments: D2TrackerEnrollment[];
    programOwners: ProgramOwner[];
    geometry:
        | Extract<D2Geometry, { type: "Point" }>
        | Extract<D2Geometry, { type: "Polygon" }>
        | Extract<D2Geometry, { type: "MultiPolygon" }>;
}

export type D2TrackerTrackedEntity = D2TrackerTrackedEntityBase;

type RequiredFieldsOnPost =
    | "orgUnit"
    | "trackedEntity"
    | "trackedEntityType"
    | "enrollments"
    | "attributes";

export type D2TrackedEntityInstanceToPost = Omit<
    RequiredBy<D2TrackerTrackedEntity, RequiredFieldsOnPost>,
    "enrollments" | "attributes"
> & {
    enrollments: D2TrackerEnrollmentToPost[];
    attributes: AttributeToPost[];
};

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

export interface Attribute {
    attribute: Id;
    code?: string;
    displayName: string;
    createdAt: IsoDate;
    updatedAt: IsoDate;
    storedBy: string;
    valueType: string;
    value: string;
}

export type AttributeToPost = Pick<Attribute, "attribute" | "value">;

export type TrackerTrackedEntitiesParams<Fields> = Params & { fields: Fields } & Partial<{
        totalPages: boolean;
        page: number;
        pageSize: number;
        paging: boolean;
    }>;

type Params = RequireAtLeastOne<
    Partial<TrackedEntitiesParamsBase>,
    "program" | "trackedEntityType" | "trackedEntities"
>;

export type OrgUnitMode =
    | "SELECTED"
    | "CHILDREN"
    | "DESCENDANTS"
    | "ACCESSIBLE"
    | "CAPTURE"
    | "ALL";

export type TrackedEntitiesParamsBase = {
    orgUnits: CommaDelimitedListOfUid;
    orgUnitMode: OrgUnitMode;
    trackedEntities: CommaDelimitedListOfUid;
    query: string;
    attribute: CommaDelimitedListOfUid;
    filter: CommaDelimitedListOfAttributeFilter;
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
    trackedEntity: Id;
    assignedUserMode: "CURRENT" | "PROVIDED" | "NONE" | "ANY";
    assignedUsers: CommaDelimitedListOfUid;
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
} & (TrackedOrderField | TrackedAttributesFields);

export type TrackedOrderField = {
    type: "field";
    field:
        | "createdAtClient"
        | "createdAt"
        | "enrolledAt"
        | "inactive"
        | "trackedEntity"
        | "updatedAt";
};

export type TrackedAttributesFields = { type: "trackedEntityAttributeId"; id: Id };

export type TrackedPager = {
    page: number;
    pageSize: number;
    // These two fields are available only for requests with query "totalPages=true"
    pageCount?: number;
    total?: number;
};

export type TrackedEntitiesGetResponse<Fields> = {
    pager: TrackedPager;
    trackedEntities: SelectedPick<D2TrackerTrackedEntitySchema, Fields>[];
};

export interface D2TrackerTrackedEntitySchema {
    name: "D2TrackerTrackedEntity";
    model: D2TrackerTrackedEntity;
    fields: Omit<D2TrackerTrackedEntity, "enrollments"> & {
        enrollments: D2TrackerEnrollmentSchema[];
    };
    fieldPresets: {
        $all: Omit<Preset<D2TrackerTrackedEntity, keyof D2TrackerTrackedEntity>, "enrollments"> & {
            enrollments: D2TrackerEnrollmentSchema["fieldPresets"]["$all"][];
        };
        $identifiable: never;
        $nameable: never;
        $persisted: never;
        $owner: never;
    };
}

export type D2TrackerTrackedEntityFields = Selector<D2TrackerTrackedEntitySchema>;

type TrackerResponse<Fields> = TrackedEntitiesGetResponse<Fields> & {
    trackedEntities: SelectedPick<D2TrackerTrackedEntitySchema, Fields>[] | undefined;
};

export interface TeiPostResponse {
    responseType: "ImportSummaries";
    status: "ERROR" | "SUCCESS";
    imported: number;
    updated: number;
    deleted: number;
    ignored: number;
    total: number;
    importSummaries?: Array<
        | {
              responseType: "ImportSummary";
              status: "ERROR";
              reference?: string;
              conflicts: Array<{
                  object: string;
                  value: string;
              }>;
              importCount: {
                  imported: number;
                  updated: number;
                  ignored: number;
                  deleted: number;
              };
          }
        | {
              responseType: "ImportSummary";
              status: "SUCCESS";
              reference: string;
              importCount: {
                  imported: number;
                  updated: number;
                  ignored: number;
                  deleted: number;
              };
              enrollments: {
                  responseType: "ImportSummaries";
                  status: "ERROR" | "SUCCESS";
                  imported: number;
                  updated: number;
                  deleted: number;
                  ignored: number;
                  total: number;
              };
          }
    >;
}
