import { D2ApiResponse } from "./base";
import { AsyncPostResponse, HttpResponse } from "./common";
import { D2ApiGeneric } from "./d2Api";

export class Tracker {
    constructor(public d2Api: D2ApiGeneric) {}

    post(
        params: TrackerPostParams,
        request: TrackerPostRequest
    ): D2ApiResponse<HttpResponse<TrackerPostResponse>> {
        return this.d2Api.post<HttpResponse<TrackerPostResponse>>(
            "/tracker",
            { ...params, async: false },
            request
        );
    }

    postAsync(
        params: TrackerPostParams,
        request: TrackerPostRequest
    ): D2ApiResponse<AsyncPostResponse<"TRACKER_IMPORT_JOB">> {
        return this.d2Api.post<AsyncPostResponse<"TRACKER_IMPORT_JOB">>(
            "/tracker",
            { ...params, async: true },
            request
        );
    }
}
export interface TrackerPostRequest {
    trackedEntities: TrackedEntity[];
}
export interface TrackedEntity {
    orgUnit: string;
    trackedEntity: string;
    trackedEntityType: string;
    enrollments?: Enrollment[];
}
export interface Enrollment {
    orgUnit: string;
    program: string;
    enrollment: string;
    trackedEntityType: string;
    notes: [];
    relationships: [];
    attributes: EnrollmentAttribute[];
    events: EnrollmentEvent[];
    enrolledAt: string;
    occurredAt: string;
}
export interface EnrollmentAttribute {
    attribute: string;
    value: Date | string | number;
}
export interface EnrollmentEvent {
    program: string;
    event: string;
    programStage: string;
    orgUnit: string;
    dataValues: { dataElement: string; value: string | number }[];
    occurredAt: string;
}
export type TrackerPostParams = Partial<{
    async : boolean,
    reportMode : "FULL" |  "ERRORS" | "WARNINGS",
    importMode : "VALIDATE" | "COMMIT",
    idScheme : "UID"| "CODE"| "NAME"| "ATTRIBUTE",
    dataElementIdScheme : "UID"| "CODE"| "NAME"| "ATTRIBUTE",
    orgUnitIdScheme : "UID"| "CODE"| "NAME"| "ATTRIBUTE",
    programIdScheme :  "UID"| "CODE"| "NAME"| "ATTRIBUTE",
    programStageIdScheme : "UID"| "CODE"| "NAME"| "ATTRIBUTE",
    categoryOptionComboIdScheme : "UID"| "CODE"| "NAME"| "ATTRIBUTE",
    categoryOptionIdScheme : "UID"| "CODE"| "NAME"| "ATTRIBUTE",
    importStrategy : "CREATE" | "UPDATE" | "CREATE_AND_UPDATE" | "DELETE",
    atomicMode : "ALL" | "OBJECT",
    flushMode : "AUTO" | "OBJECT",
    validationMode : "FULL" | "FAIL_FAST" | "SKIP",
    skipPatternValidation : boolean,
    skipSideEffects : boolean,
    skipRuleEngine : boolean
}>

interface ErrorReport {
    message: string;
    errorCode: string;
    trackerType: string;
    uid: string;
}
interface Stats {
    created: number;
    updated: number;
    deleted: number;
    ignored: number;
    total: number;
}
interface ObjectReports {
    trackerType: "ENROLLMENT" | "TRACKED_ENTITY" | "RELATIONSHIP" | "EVENT";
    uid: string;
    index: number;
    errorReports: ErrorReport[];
}
interface BundleReport {
    status: "OK";
    typeReportMap: {
        ENROLLMENT: {
            trackerType: "ENROLLMENT";
            stats: Stats;
            objectReports: ObjectReports[];
        };
        TRACKED_ENTITY: {
            trackerType: "TRACKED_ENTITY";
            stats: Stats;
            objectReports: ObjectReports[];
        };
        RELATIONSHIP: {
            trackerType: "RELATIONSHIP";
            stats: Stats;
            objectReports: ObjectReports[];
        };
        EVENT: {
            trackerType: "EVENT";
            stats: Stats;
            objectReports: ObjectReports[];
        };
    };
    stats: Stats;
}
export interface TrackerPostResponse {
    status: "OK" | "ERROR" | "WARNING",
    validationReport: {
        errorReports: ErrorReport[];
        warningReports: ErrorReport[];
    };
    stats: Stats;
    bundleReport: BundleReport;
    timingsStats: {},
    message: string
}