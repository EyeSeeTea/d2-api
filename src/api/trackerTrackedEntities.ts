import _ from "lodash";
import { FieldPresets, Preset } from "../schemas";
import { Id, Selector } from "./base";
import { D2ApiResponse, getFieldsAsString } from "./common";
import { D2ApiGeneric } from "./d2Api";
import { D2TrackerEnrollment } from "./trackerEnrollments";
import { D2TrackerEvent } from "./trackerEvents";

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

export interface D2TrackerTrackedEntity {
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
    events?: D2TrackerEvent[];
    programOwners?: ProgramOwner[];
}

interface ProgramOwner {
    ownerOrgUnit: Id;
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

export interface Enrollment {
    enrollment: Id;
    program: Id;
    orgUnit: Id;
    enrollmentDate: IsoDate;
    incidentDate: IsoDate;
    events?: Event[];
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

export type TrackedEntitiesOuRequest =
    | { ouMode?: "ACCESSIBLE" | "CAPTURE" | "ALL"; ou?: never[] }
    | { ouMode?: "SELECTED" | "CHILDREN" | "DESCENDANTS"; ou: Id[] };

type TrackerTrackedEntitiesParams<Fields> = Params & { fields: Fields } & Partial<{
        totalPages: boolean;
        page: number;
        pageSize: number;
    }>;

type Params =
    | ({ orgUnit: SemiColonDelimitedListOfUid } & PartialParams)
    | ({ ouMode: "ALL" } & PartialParams)
    | (Pick<TrackedEntitiesParamsBase, "programStatus" | "program"> & PartialParams)
    | (Pick<TrackedEntitiesParamsBase, "followUp" | "program"> & PartialParams)
    | (Pick<TrackedEntitiesParamsBase, "enrollmentEnrolledAfter" | "program"> & PartialParams)
    | (Pick<TrackedEntitiesParamsBase, "enrollmentEnrolledBefore" | "program"> & PartialParams);

type PartialParams = Partial<TrackedEntitiesParamsBase>;

export type TrackedEntitiesParamsBase = TrackedEntitiesOuRequest & {
    query: string;
    attribute: CommaDelimitedListOfUid;
    filter: CommaDelimitedListOfAttributeFilter;
    orgUnit: SemiColonDelimitedListOfUid;
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
