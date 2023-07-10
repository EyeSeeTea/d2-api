import { D2ApiGeneric } from "./d2Api";
import { CancelableResponse } from "../repositories/CancelableResponse";
import { Id, Selector, D2ApiResponse, SelectedPick } from "./base";
import { Preset, FieldPresets } from "../schemas";
import { getFieldsAsString } from "./common";

export class TrackerEnrollments {
    constructor(public api: D2ApiGeneric) {}

    get<Fields extends D2TrackerEnrollmentFields>(
        params: TrackerEnrollmentsParams<Fields>
    ): CancelableResponse<TrackerEnrollmentsResponse> {
        return this.api.get<TrackerEnrollmentsResponse>(`/tracker/enrollments`, params);
    }

    getById<Fields extends D2TrackerEnrollmentFields>(
        params: TrackerEnrollmentParams<Fields>
    ): D2ApiResponse<GetEnrollment<Fields>> {
        return this.api.get<GetEnrollment<Fields>>("/events", {
            ...params,
            fields: getFieldsAsString(params.fields),
        });
    }
}

type TrackerEnrollmentsParams<Fields> = Params &
    Partial<{
        fields: Fields;
        totalPages: boolean;
        page: number;
        pageSize: number;
    }>;

export type Params =
    | (TrackerEnrollmentsParamsBase["orgUnit"] & PartialParams)
    | ({ ouMode: "ALL" } & PartialParams)
    | (Pick<TrackerEnrollmentsParamsBase, "programStatus" | "program"> & PartialParams)
    | (Pick<TrackerEnrollmentsParamsBase, "followUp" | "program"> & PartialParams)
    | (Pick<TrackerEnrollmentsParamsBase, "enrolledAfter"> & PartialParams)
    | (Pick<TrackerEnrollmentsParamsBase, "enrolledBefore"> & PartialParams);

type PartialParams = Partial<TrackerEnrollmentsParamsBase>;

type ProgramStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

type TrackerEnrollmentsParamsBase = {
    orgUnit: SemiColonDelimitedListOfUid;
    ouMode: "SELECTED" | "CHILDREN" | "DESCENDANTS" | "ACCESSIBLE" | "CAPTURE" | "ALL";
    program: Id;
    programStatus: "ACTIVE" | "COMPLETED" | "CANCELLED";
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
type IsoDate = string;
type Username = string;

export interface TrackerEnrollmentsResponse {
    page: number;
    pageSize: number;
    instances: D2TrackerEnrollment[];
    total?: number; // Only if requested with totalPages=true
}

export interface D2TrackerEnrollment {
    enrollment: Id;
    createdAt: IsoDate;
    createdAtClient: IsoDate;
    updatedAt: IsoDate;
    updatedAtClient: IsoDate;
    trackedEntity?: Id;
    trackedEntityType?: Id;
    program: Id;
    status: ProgramStatus;
    orgUnit: Id;
    orgUnitName: string;
    enrolledAt: IsoDate;
    occurredAt: IsoDate;
    followUp: boolean;
    deleted: boolean;
    storedBy: Username;
    events: [];
    relationships: [];
    attributes: [];
    notes: [];
}

export interface D2TrackerEnrollmentSchema {
    name: "D2TrackerEnrollment";
    model: D2TrackerEnrollment;
    fields: D2TrackerEnrollment;
    fieldPresets: {
        $all: Preset<D2TrackerEnrollment, keyof D2TrackerEnrollment>;
        $identifiable: Preset<D2TrackerEnrollment, FieldPresets["identifiable"]>;
        $nameable: Preset<D2TrackerEnrollment, FieldPresets["nameable"]>;
        $persisted: Preset<D2TrackerEnrollment, never>;
        $owner: Preset<D2TrackerEnrollment, never>;
    };
}

type GetEnrollment<Fields> = SelectedPick<D2TrackerEnrollmentSchema, Fields>;

type D2TrackerEnrollmentFields = Selector<D2TrackerEnrollmentSchema>;

type TrackerEnrollmentParams<Fields> = { fields: Fields };
