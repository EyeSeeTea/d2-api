import { D2ApiGeneric } from "./d2Api";
import { Id, Selector, D2ApiResponse, SelectedPick } from "./base";
import { Preset } from "../schemas";
import { getFieldsAsString, parseTrackerPager } from "./common";
import { D2TrackerEvent, D2TrackerEventSchema, Note, D2TrackerEventToPost } from "./trackerEvents";
import _ from "lodash";
import { RequiredBy } from "../utils/types";
import { TrackedPager } from "./trackerTrackedEntities";

export class TrackerEnrollments {
    constructor(public api: D2ApiGeneric) {}

    get<Fields extends D2TrackerEnrollmentFields>(
        params: TrackerEnrollmentsParams<Fields>
    ): D2ApiResponse<TrackerEnrollmentsResponse<Fields>> {
        return this.api
            .get<EnrollmentResponse<Fields>>("/tracker/enrollments", {
                ..._.omit(params, ["fields"]),
                fields: getFieldsAsString(params.fields),
            })
            .map(({ data }) => {
                return {
                    ..._.omit(data, "enrollments"),
                    pager: parseTrackerPager(data),
                    instances: data.enrollments || data.instances || [],
                };
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
    followUp: boolean;
    deleted: boolean;
    storedBy: Username;
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
        skipPaging: boolean;
    }>;

type Params = RequiredBy<TrackerEnrollmentsParamsBase, "ouMode">;

type TrackerEnrollmentsParamsBase = {
    orgUnit: SemiColonDelimitedListOfUid;
    ouMode: "SELECTED" | "CHILDREN" | "DESCENDANTS" | "ACCESSIBLE" | "CAPTURE" | "ALL";
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

type SemiColonDelimitedListOfUid = string;
type CommaDelimitedListOfUid = string;

interface TrackerEnrollmentsResponse<Fields> extends TrackedPager {
    pager?: TrackedPager;
    instances: SelectedPick<D2TrackerEnrollmentSchema, Fields>[];
}

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

type EnrollmentResponse<Fields> = Omit<TrackerEnrollmentsResponse<Fields>, "instances"> & {
    instances: SelectedPick<D2TrackerEnrollmentSchema, Fields>[] | undefined;
    enrollments: SelectedPick<D2TrackerEnrollmentSchema, Fields>[] | undefined;
};
