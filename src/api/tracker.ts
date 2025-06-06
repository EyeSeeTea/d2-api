import { cache } from "../utils/cache";
import { TrackerEnrollments, D2TrackerEnrollmentToPost } from "./trackerEnrollments";
import { D2ApiResponse, Selector } from "./base";
import { AsyncPostResponse, getFieldsAsString } from "./common";
import { D2ApiGeneric } from "./d2Api";
import { TrackerEvents, D2TrackerEventToPost } from "./trackerEvents";
import {
    TrackedEntities,
    D2TrackedEntityInstanceToPost,
    D2TrackerTrackedEntitySchema,
} from "./trackerTrackedEntities";

export class Tracker {
    constructor(public d2Api: D2ApiGeneric) {}

    @cache()
    get trackedEntities() {
        return new TrackedEntities(this.d2Api);
    }
    @cache()
    get enrollments() {
        return new TrackerEnrollments(this.d2Api);
    }
    @cache()
    get events() {
        return new TrackerEvents(this.d2Api);
    }

    post(
        params: TrackerPostParams,
        request: TrackerPostRequest
    ): D2ApiResponse<TrackerPostResponse> {
        return this.d2Api.post<TrackerPostResponse>(
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

export function getTrackerFieldsParam<Fields extends Selector<D2TrackerTrackedEntitySchema>>(
    fields: Fields
): string {
    const keys = Object.keys(fields);

    if (keys.some(param => param.startsWith("$"))) {
        if (keys.includes("$all")) {
            // Unlike the metadata endpoint, the tracked entpoint does not support
            // $TYPE selectors. Convert :all -> * and error on all others.
            return "*";
        } else {
            throw new Error(`Invalid virtual fields: ${keys.join(", ")}. Only $all is supported.`);
        }
    } else {
        return getFieldsAsString(fields);
    }
}

export interface TrackerPostRequest {
    trackedEntities?: D2TrackedEntityInstanceToPost[];
    enrollments?: D2TrackerEnrollmentToPost[];
    events?: D2TrackerEventToPost[];
}

type SchemeOptions = "UID" | "CODE" | "NAME" | "ATTRIBUTE";
export type TrackerPostParams = Partial<{
    async: boolean;
    reportMode: "FULL" | "ERRORS" | "WARNINGS";
    importMode: "VALIDATE" | "COMMIT";
    idScheme: SchemeOptions;
    dataElementIdScheme: SchemeOptions;
    orgUnitIdScheme: SchemeOptions;
    programIdScheme: SchemeOptions;
    programStageIdScheme: SchemeOptions;
    categoryOptionComboIdScheme: SchemeOptions;
    categoryOptionIdScheme: SchemeOptions;
    importStrategy: "CREATE" | "UPDATE" | "CREATE_AND_UPDATE" | "DELETE";
    atomicMode: "ALL" | "OBJECT";
    flushMode: "AUTO" | "OBJECT";
    validationMode: "FULL" | "FAIL_FAST" | "SKIP";
    skipPatternValidation: boolean;
    skipSideEffects: boolean;
    skipRuleEngine: boolean;
}>;

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
    status: "OK" | "ERROR" | "WARNING";
    validationReport: {
        errorReports: ErrorReport[];
        warningReports: ErrorReport[];
    };
    stats: Stats;
    bundleReport: BundleReport;
    timingsStats: {};
    message: string;
}
