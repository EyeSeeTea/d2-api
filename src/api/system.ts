import _ from "lodash";
import { Id } from "../schemas";
import { timeout } from "../utils/promises";
import { D2ApiResponse } from "./common";
import { D2ApiGeneric } from "./d2Api";
import { DataValueSetsPostResponse } from "./dataValues";
import { EventsPostResponse } from "./events";
import { MetadataResponse } from "./metadata";
import { TeiPostResponse } from "./trackedEntityInstances";
import { TrackerPostResponse } from "./tracker";

export class System {
    constructor(public d2Api: D2ApiGeneric) {}

    getIds(options: { limit?: number }): D2ApiResponse<Id[]> {
        return this.d2Api
            .request<{ codes: Id[] }>({ method: "get", url: `/system/id`, params: options })
            .map(res => (res.data && res.data.codes) || []);
    }

    get info(): D2ApiResponse<SystemInfo> {
        return this.d2Api.request({ method: "get", url: `/system/info` });
    }

    ping(): D2ApiResponse<boolean> {
        return this.d2Api
            .request({
                method: "get",
                url: `/system/info`,
                validateStatus: (status: number) => [200, 302, 401].includes(status),
            })
            .map(res => res.status === 200);
    }

    getTaskEntries(selector: TaskSelector): D2ApiResponse<TaskEntry[]> {
        return this.d2Api.request({
            method: "get",
            url: _.compact(["/system/tasks", selector.category, selector.id]).join("/"),
        });
    }

    waitFor<Type extends keyof WaitForResponse>(
        jobType: Type,
        id: string,
        options: { interval?: number; maxRetries?: number } = {}
    ): D2ApiResponse<WaitForResponse[Type] | null> {
        const { interval = 1000, maxRetries } = options;

        let retries = 0;

        const checkTask = async () => {
            const result = await this.d2Api
                .get<{ message: string; completed?: boolean }[]>(`/system/tasks/${jobType}/${id}`)
                .getData();

            return _.some(result, ({ completed }) => completed);
        };

        const prepareResponse = async () => {
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const isDone = await checkTask();
                const hasReachedMaxRetries = maxRetries !== undefined && retries > maxRetries;
                if (isDone || hasReachedMaxRetries) break;

                await timeout(interval);
                retries = retries + 1;
            }

            const { response } = this.d2Api.get<WaitForResponse[typeof jobType] | null>(
                `/system/taskSummaries/${jobType}/${id}`
            );

            return response();
        };

        return D2ApiResponse.build({
            cancel: _.noop,
            response: () => prepareResponse(),
        });
    }

    get tasks(): D2ApiResponse<Tasks> {
        return this.d2Api.request({ method: "get", url: `/system/tasks` });
    }

    get flags(): D2ApiResponse<SystemItem[]> {
        return this.d2Api.request({ method: "get", url: `/system/flags` });
    }

    get styles(): D2ApiResponse<SystemItem[]> {
        return this.d2Api.request({ method: "get", url: `/system/styles` });
    }
}

export interface SystemItem {
    name: string;
    key: string;
    path: string;
}

export type Tasks = Record<TaskCategory, Record<Id, TaskEntry[]>>;

export type TaskCategory =
    | "ANALYTICSTABLE_UPDATE"
    | "ANALYTICS_TABLE"
    | "COMPLETE_DATA_SET_REGISTRATION_IMPORT"
    | "CREDENTIALS_EXPIRY_ALERT"
    | "DATAVALUE_IMPORT"
    | "DATAVALUE_IMPORT_INTERNAL"
    | "DATA_INTEGRITY"
    | "DATA_SET_NOTIFICATION"
    | "DATA_STATISTICS"
    | "DATA_SYNC"
    | "ENROLLMENT_IMPORT"
    | "EVENT_IMPORT"
    | "FILE_RESOURCE_CLEANUP"
    | "GML_IMPORT"
    | "LEADER_ELECTION"
    | "LEADER_RENEWAL"
    | "METADATA_IMPORT"
    | "META_DATA_SYNC"
    | "MOCK"
    | "MONITORING"
    | "PREDICTOR"
    | "PROGRAM_DATA_SYNC"
    | "PROGRAM_NOTIFICATIONS"
    | "PUSH_ANALYSIS"
    | "REMOVE_EXPIRED_RESERVED_VALUES"
    | "RESOURCE_TABLE"
    | "SEND_SCHEDULED_MESSAGE"
    | "SMS_SEND"
    | "TEI_IMPORT"
    | "TRACKER_IMPORT_JOB"
    | "VALIDATION_RESULTS_NOTIFICATION";
   

export interface TaskSelector {
    category: TaskCategory;
    id?: Id;
}

export interface TaskEntry {
    uid: Id;
    level: string;
    category: TaskCategory;
    time: string;
    message: string;
    completed: boolean;
}

export interface SystemInfo {
    // Docs: If the user who is requesting this resource does not have full authority in the
    // system then only the first seven properties will be included, as this information is
    // security sensitive.
    contextPath: string;
    userAgent: string;
    version: string;
    revision: string;
    buildTime: Date;
    serverDate: Date;
    environmentVariable: string;

    javaVersion?: string;
    javaVendor?: string;
    calendar?: string;
    dateFormat?: string;
    lastAnalyticsTableSuccess?: Date;
    intervalSinceLastAnalyticsTableSuccess?: string;
    lastAnalyticsTableRuntime?: string;
    jasperReportsVersion?: string;
    fileStoreProvider?: string;
    readOnlyMode?: string;
    nodeId?: string;
    osName?: string;
    osArchitecture?: string;
    osVersion?: string;
    externalDirectory?: string;
    databaseInfo?: {
        name: string;
        user: string;
        spatialSupport: boolean;
    };
    readReplicaCount?: number;
    memoryInfo?: string;
    cpuCores?: number;
    encryption?: boolean;
    emailConfigured?: boolean;
    redisEnabled?: boolean;
    systemId?: string;
    systemName?: string;
    clusterHostname?: string;
    isMetadataVersionEnabled?: boolean;
    metadataAudit?: {
        persist: boolean;
        log: boolean;
    };
    logging?: {
        level: string;
        format: string;
        consoleEnabled: boolean;
        consoleLevel: string;
        consoleFormat: string;
        fileEnabled: boolean;
        fileName: string;
        fileLevel: string;
        fileFormat: string;
    };
    metadataSyncEnabled?: boolean;
}

export type WaitForResponse = {
    DATAVALUE_IMPORT: DataValueSetsPostResponse;
    EVENT_IMPORT: EventsPostResponse;
    METADATA_IMPORT: MetadataResponse;
    TEI_IMPORT: TeiPostResponse;
    TRACKER_IMPORT_JOB : TrackerPostResponse;
};
