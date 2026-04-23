import { D2ApiGeneric } from "./d2Api";
import { Id, Selector, D2ApiResponse, SelectedPick } from "./base";
import { Preset, D2Geometry } from "../schemas";
import { D2TrackerEvent, D2TrackerEventSchema, Note, D2TrackerEventToPost } from "./trackerEvents";
import _ from "lodash";
import { RequiredBy } from "../utils/types";
import {
    Attribute,
    OrgUnitMode,
    Relationship,
    TrackedPager,
    UserInfo,
} from "./trackerTrackedEntities";
import { getTrackerFieldsParam } from "./tracker";

export class TrackerEnrollments {
    constructor(public api: D2ApiGeneric) {}

    get<Fields extends D2TrackerEnrollmentFields>(
        params: TrackerEnrollmentsParams<Fields>
    ): D2ApiResponse<TrackerEnrollmentsResponse<Fields>> {
        return this.api.get<EnrollmentResponse<Fields>>("/tracker/enrollments", {
            ..._.omit(params, ["fields"]),
            fields: getTrackerFieldsParam(params.fields),
        });
    }
}

type ProgramStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type IsoDate = string;

type Username = string;

export interface D2TrackerEnrollment {
    enrollment: Id;
    createdAt: IsoDate;
    createdAtClient: IsoDate;
    updatedAt: IsoDate;
    updatedAtClient: IsoDate;
    trackedEntity: Id;
    trackedEntityType: Id;
    program: Id;
    status: ProgramStatus;
    orgUnit: Id;
    orgUnitName: string;
    enrolledAt: IsoDate;
    occurredAt: IsoDate;
    completedAt?: IsoDate;
    completedBy?: string;
    followUp: boolean;
    deleted: boolean;
    storedBy: Username;
    createdBy?: UserInfo;
    updatedBy?: UserInfo;
    geometry?: Extract<D2Geometry, { type: "Point" }> | Extract<D2Geometry, { type: "Polygon" }>;
    events: D2TrackerEvent[];
    attributes: Attribute[];
    relationships?: Relationship[];
    notes: Note[];
}

type RequiredFieldsOnPost =
    | "enrollment"
    | "trackedEntity"
    | "enrolledAt"
    | "occurredAt"
    | "orgUnit"
    | "program"
    | "events";

export type D2TrackerEnrollmentToPost = Omit<
    RequiredBy<D2TrackerEnrollment, RequiredFieldsOnPost>,
    "events" | "attributes"
> & {
    events: D2TrackerEventToPost[];
    attributes: D2TrackerEnrollmentAttribute[];
};

export interface D2TrackerEnrollmentAttribute {
    attribute: string;
    value: Date | string | number;
}

type TrackerEnrollmentsParams<Fields> = Params & { fields: Fields } & Partial<{
        totalPages: boolean;
        page: number;
        pageSize: number;
        skipPaging: boolean;
    }>;

// TODO: in v40 ?orgUnit=[ID] is required
type Params = Partial<TrackerEnrollmentsParamsBase>;

type TrackerEnrollmentsParamsBase = {
    orgUnit: Id;
    ouMode: OrgUnitMode;
    program: Id;
    programStatus: ProgramStatus;
    followUp: boolean;
    updatedAfter: IsoDate;
    updatedWithin: IsoDate;
    enrolledAfter: IsoDate;
    enrolledBefore: IsoDate;
    trackedEntityType: Id;
    trackedEntity: Id;
    enrollment: CommaDelimitedListOfUid;
    includeDeleted: boolean;
};

type CommaDelimitedListOfUid = string;

export type TrackerEnrollmentsResponse<Fields> = TrackedPager & {
    instances: SelectedPick<D2TrackerEnrollmentSchema, Fields>[];
};

export interface D2TrackerEnrollmentSchema {
    name: "D2TrackerEnrollment";
    model: D2TrackerEnrollment;
    fields: Omit<D2TrackerEnrollment, "events"> & {
        events: D2TrackerEventSchema[];
    };
    fieldPresets: {
        $all: Omit<Preset<D2TrackerEnrollment, keyof D2TrackerEnrollment>, "events"> & {
            events: D2TrackerEventSchema["fieldPresets"]["$all"][];
        };
        $identifiable: never;
        $nameable: never;
        $persisted: never;
        $owner: never;
    };
}

type D2TrackerEnrollmentFields = Selector<D2TrackerEnrollmentSchema>;

type EnrollmentResponse<Fields> = TrackerEnrollmentsResponse<Fields>;
