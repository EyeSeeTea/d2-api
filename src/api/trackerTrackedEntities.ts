import _ from "lodash";
import { D2Geometry, FieldPresets, Preset } from "../schemas";
import { Id, Selector, SelectedPick } from "./base";
import { D2ApiResponse, getFieldsAsString } from "./common";
import { D2ApiGeneric } from "./d2Api";
import {
    D2TrackerEnrollment,
    D2TrackerEnrollmentSchema,
    D2TrackerEnrollmentToPost,
} from "./trackerEnrollments";
import { RequiredBy } from "../utils/types";

export class TrackedEntities {
    constructor(public d2Api: D2ApiGeneric) {}

    get<Fields extends D2TrackerTrackedEntityFields>(
        params: TrackerTrackedEntitiesParams<Fields>
    ): D2ApiResponse<TrackedEntitiesGetResponse<Fields>> {
        return this.d2Api.get<TrackedEntitiesGetResponse<Fields>>("/tracker/trackedEntities", {
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
    geometry: Extract<D2Geometry, { type: "Point" }> | Extract<D2Geometry, { type: "Polygon" }>;
}

export type D2TrackerTrackedEntity = D2TrackerTrackedEntityBase;

type RequiredFieldsOnPost =
    | "attributes"
    | "createdAtClient"
    | "enrollments"
    | "orgUnit"
    | "relationships"
    | "trackedEntity"
    | "trackedEntityType"
    | "updatedAtClient";

export type D2TrackedEntityInstanceToPost = Omit<
    RequiredBy<D2TrackerTrackedEntity, RequiredFieldsOnPost>,
    "events" | "attributes"
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
    displayName?: string;
    createdAt?: IsoDate;
    updatedAt?: IsoDate;
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
};

export interface TrackedEntitiesGetResponse<Fields> {
    page: number;
    pageSize: number;
    instances: SelectedPick<D2TrackerTrackedEntitySchema, Fields>[];
    total?: number; // Only if requested with totalPages=true
}

export interface D2TrackerTrackedEntitySchema {
    name: "D2TrackerTrackedEntity";
    model: D2TrackerTrackedEntity;
    fields: D2TrackerTrackedEntity & {
        enrollments: D2TrackerEnrollmentSchema[];
    };
    fieldPresets: {
        $all: Preset<D2TrackerTrackedEntity, keyof D2TrackerTrackedEntity>;
        $identifiable: Preset<D2TrackerTrackedEntity, FieldPresets["identifiable"]>;
        $nameable: Preset<D2TrackerTrackedEntity, FieldPresets["nameable"]>;
        $persisted: Preset<D2TrackerTrackedEntity, never>;
        $owner: Preset<D2TrackerTrackedEntity, never>;
    };
}

type D2TrackerTrackedEntityFields = Selector<D2TrackerTrackedEntitySchema>;
