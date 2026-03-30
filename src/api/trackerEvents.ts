import { D2ApiGeneric } from "./d2Api";
import { Id, Selector, D2ApiResponse, SelectedPick } from "./base";
import { Preset, D2Geometry } from "../schemas";
import _ from "lodash";
import { RequiredBy } from "../utils/types";
import { OrgUnitMode, TrackedPager } from "./trackerTrackedEntities";
import { getTrackerFieldsParam } from "./tracker";

export class TrackerEvents {
    constructor(public api: D2ApiGeneric) {}

    get<Fields extends D2TrackerEventFields>(
        params: EventsParams<Fields>
    ): D2ApiResponse<TrackerEventsResponse<Fields>> {
        return this.api.get<EventsResponse<Fields>>("/tracker/events", {
            ..._.omit(params, ["fields"]),
            fields: getTrackerFieldsParam(params.fields),
        });
    }

    getById<Fields extends D2TrackerEventFields>(
        id: string,
        params: EventsParams<Fields>
    ): D2ApiResponse<D2TrackerEvent> {
        return this.api.get<D2TrackerEvent>(`/tracker/events/${id}`, {
            ..._.omit(params, ["fields"]),
            fields: getTrackerFieldsParam(params.fields),
        });
    }
}

type ProgramStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
type IsoDate = string;
type Username = string;
type CommaDelimitedListOfUid = string;
type CommaDelimitedListOfAttributeFilter = string;
type CommaDelimitedListOfDataElementFilter = string;
type UserInfo = {
    uid: Id;
    username: string;
    firstName: string;
    surname: string;
};
type EventStatus = "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULE" | "OVERDUE" | "SKIPPED";
type IdScheme = string;

interface D2TrackerEventBase {
    event: Id;
    status: EventStatus;
    program: Id;
    programStage: Id;
    enrollment: Id;
    enrollmentStatus: "ACTIVE" | "COMPLETED" | "CANCELLED";
    orgUnit: Id;
    orgUnitName: string;
    occurredAt: IsoDate;
    scheduledAt: IsoDate;
    storedBy: Username;
    followup: boolean;
    deleted: boolean;
    createdAt: IsoDate;
    updatedAt: IsoDate;
    createdBy: UserInfo;
    attributeOptionCombo: Id;
    attributeCategoryOptions: Id;
    updatedBy: UserInfo;
    dataValues: DataValue[];
    notes: Note[];
    trackedEntity?: Id;
}

export type D2TrackerEvent = D2TrackerEventBase & {
    geometry?: Extract<D2Geometry, { type: "Point" }> | Extract<D2Geometry, { type: "Polygon" }>;
};

type RequiredFieldsOnPost =
    | "event"
    | "program"
    | "programStage"
    | "occurredAt"
    | "orgUnit"
    | "dataValues";

export type D2TrackerEventToPost = Omit<
    RequiredBy<D2TrackerEvent, RequiredFieldsOnPost>,
    "dataValues"
> & {
    dataValues: Array<RequiredBy<DataValue, "dataElement" | "value">>;
};

export type Note = {
    note: Id;
    storedAt: IsoDate;
    storedBy: Username;
    value: string;
};

export type EventsParams<Fields> = EventsParamsBase & { fields: Fields } & Partial<{
        totalPages: boolean;
        page: number;
        pageSize: number;
        paging: boolean;
    }>;

interface EventsParamsBase {
    events?: CommaDelimitedListOfUid;
    orgUnitMode?: OrgUnitMode;
    program?: Id;
    programStage?: Id;
    programStatus?: ProgramStatus;
    filter?: CommaDelimitedListOfDataElementFilter;
    filterAttributes?: CommaDelimitedListOfAttributeFilter;
    followUp?: boolean;
    trackedEntity?: Id;
    orgUnit?: Id;
    event?: Id;
    status?: "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULE" | "OVERDUE" | "SKIPPED";
    occurredAfter?: IsoDate;
    occurredBefore?: IsoDate;
    scheduledAfter?: IsoDate;
    scheduledBefore?: IsoDate;
    updatedAt?: IsoDate;
    updatedAfter?: IsoDate;
    updatedBefore?: IsoDate;
    updatedWithin?: IsoDate;
    enrollmentEnrolledAfter?: IsoDate;
    enrollmentEnrolledBefore?: IsoDate;
    enrollmentOccurredAfter?: IsoDate;
    enrollmentOccurredBefore?: IsoDate;
    skipMeta?: boolean;
    dataElementIdScheme?: IdScheme;
    categoryOptionComboIdScheme?: IdScheme;
    orgUnitIdScheme?: IdScheme;
    programIdScheme?: IdScheme;
    programStageIdScheme?: IdScheme;
    idScheme?: IdScheme;
    order?: CommaDelimitedListOfUid;
    skipEventId?: boolean;
    attributeCc?: string;
    attributeCos?: string;
    includeDeleted?: boolean;
    assignedUserMode?: "CURRENT" | "PROVIDED" | "NONE" | "ANY";
    assignedUser?: CommaDelimitedListOfUid;
}

export interface DataValue {
    updatedAt: IsoDate;
    storedBy: Username;
    createdAt: IsoDate;
    dataElement: Id;
    value: string;
    providedElsewhere?: boolean;
}

export type TrackerEventsResponse<Fields> = {
    pager: TrackedPager;
    events: SelectedPick<D2TrackerEventSchema, Fields>[];
};

export interface D2TrackerEventSchema {
    name: "D2TrackerEvent";
    model: D2TrackerEvent;
    fields: D2TrackerEvent;
    fieldPresets: {
        $all: Preset<D2TrackerEvent, keyof D2TrackerEvent>;
        $identifiable: never;
        $nameable: never;
        $persisted: Preset<D2TrackerEvent, never>;
        $owner: Preset<D2TrackerEvent, never>;
    };
}

type D2TrackerEventFields = Selector<D2TrackerEventSchema>;

type EventsResponse<Fields> = TrackerEventsResponse<Fields>;

export interface EventsPostResponse {
    responseType: "ImportSummaries";
    status: "ERROR" | "SUCCESS" | "WARNING";
    imported: number;
    updated: number;
    deleted: number;
    ignored: number;
    total: number;
    importOptions: object;
    importSummaries?: Array<
        | {
              responseType: "ImportSummary";
              status: "ERROR" | "WARNING";
              reference?: string;
              description: string;
              importOptions: object;
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
              href: string;
              importOptions: object;
              importCount: {
                  imported: number;
                  updated: number;
                  ignored: number;
                  deleted: number;
              };
          }
    >;
}
