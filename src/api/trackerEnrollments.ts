import { D2ApiGeneric } from "./d2Api";
import { Id, Selector, D2ApiResponse, SelectedPick } from "./base";
import { Preset, D2Geometry } from "../schemas";
import {
    D2TrackerEvent,
    D2TrackerEventSchema,
    Note,
    D2TrackerEventToPost,
    UserInfo,
    Username,
} from "./trackerEvents";
import _ from "lodash";
import { RequiredBy } from "../utils/types";
import {
    EnrollmentStatus,
    OrgUnitMode,
    Relationship,
    TrackedPager,
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

export type IsoDate = string;

export interface D2TrackerEnrollment {
    enrollment: Id;
    createdAt: IsoDate;
    createdAtClient: IsoDate;
    updatedAt: IsoDate;
    updatedAtClient: IsoDate;
    completedAt?: IsoDate;
    completedBy?: Username;
    trackedEntity: Id;
    trackedEntityType: Id;
    program: Id;
    status: EnrollmentStatus;
    orgUnit: Id;
    orgUnitName: string;
    enrolledAt: IsoDate;
    occurredAt: IsoDate;
    followUp: boolean;
    deleted: boolean;
    storedBy: Username;
    createdBy: UserInfo;
    updatedBy: UserInfo;
    geometry?: Extract<D2Geometry, { type: "Point" }> | Extract<D2Geometry, { type: "Polygon" }>;
    relationships?: Relationship[];
    events: D2TrackerEvent[];
    attributes: D2TrackerEnrollmentAttribute[];
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
    "events"
> & {
    events: D2TrackerEventToPost[];
};

export interface D2TrackerEnrollmentAttribute {
    attribute: string;
    value: Date | string | number;
}

type TrackerEnrollmentsParams<Fields> = Params & { fields: Fields } & Partial<{
        totalPages: boolean;
        page: number;
        pageSize: number;
        paging: boolean;
    }>;

type Params = Partial<TrackerEnrollmentsParamsBase>;

type TrackerEnrollmentsParamsBase = {
    orgUnits: CommaDelimitedListOfUid;
    orgUnitMode: OrgUnitMode;
    program: Id;
    status: EnrollmentStatus;
    followUp: boolean;
    updatedAfter: IsoDate;
    updatedWithin: IsoDate;
    enrolledAfter: IsoDate;
    enrolledBefore: IsoDate;
    trackedEntityType: Id;
    trackedEntity: Id;
    enrollment: CommaDelimitedListOfUid;
    includeDeleted: boolean;
    order: CommaDelimitedListOfUid;
    attributeOptionCombo?: Id;
};

type CommaDelimitedListOfUid = string;

export type TrackerEnrollmentsResponse<Fields> = {
    pager: TrackedPager;
    enrollments: SelectedPick<D2TrackerEnrollmentSchema, Fields>[];
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
