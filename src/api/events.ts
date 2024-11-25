import {
    AsyncPostResponse,
    D2ApiResponse,
    getFieldsAsString,
    validate2xx,
    HttpResponse,
} from "./common";
import { D2ApiGeneric, unwrap } from "./d2Api";
import { Pager } from "./model";
import { Selector, SelectedPick } from ".";
import { Preset, FieldPresets, Id } from "../schemas";
import { D2Relationship, D2RelationshipSchema } from "../2.36";

export class Events {
    constructor(public d2Api: D2ApiGeneric) {}

    get<Fields extends D2EventFields>(
        params: EventsGetRequest<Fields>
    ): D2ApiResponse<PaginatedEventsGetResponse<Fields>> {
        return this.d2Api.get<PaginatedEventsGetResponse<Fields>>("/events", {
            ...params,
            fields: getFieldsAsString(params.fields),
            skipPaging: false,
        });
    }

    getAll<Fields extends D2EventFields>(
        params: EventsGetRequest<Fields>
    ): D2ApiResponse<EventsGetResponse<Fields>> {
        return this.d2Api.get<EventsGetResponse<Fields>>("/events", {
            ...params,
            fields: getFieldsAsString(params.fields),
            skipPaging: true,
            page: undefined,
            pageSize: undefined,
        });
    }

    post(params: EventsPostParams, request: EventsPostRequest): D2ApiResponse<EventsPostResponse> {
        return this.d2Api
            .post<EventsPostResponse | HttpResponse<EventsPostResponse>>(
                "/events",
                params,
                request,
                {
                    // The API returns 409 when there are warning but the POST was performed, so consider it valid
                    validateStatus: status => validate2xx(status) || status == 409,
                }
            )
            .map(unwrap);
    }

    postAsync(
        params: EventsPostParams,
        request: EventsPostRequest
    ): D2ApiResponse<AsyncPostResponse<"EVENT_IMPORT">> {
        return this.d2Api.post<AsyncPostResponse<"EVENT_IMPORT">>(
            "/events",
            { ...params, async: true },
            request
        );
    }
}

export interface D2EventSchema {
    name: "D2Event";
    model: D2Event;
    fields: D2Event & {
        dataValues: D2EventDataValueSchema[];
        relationships: D2RelationshipSchema[];
    };
    fieldPresets: {
        $all: Preset<D2Event, keyof D2Event>;
        $identifiable: Preset<D2Event, FieldPresets["identifiable"]>;
        $nameable: Preset<D2Event, FieldPresets["nameable"]>;
        $persisted: Preset<D2Event, never>;
        $owner: Preset<D2Event, never>;
    };
}

export interface D2EventDataValueSchema {
    name: "D2DataValue";
    model: DataValue;
    fields: DataValue;
    fieldPresets: {
        $all: Preset<DataValue, keyof DataValue>;
        $identifiable: Preset<DataValue, FieldPresets["identifiable"]>;
        $nameable: Preset<DataValue, FieldPresets["nameable"]>;
        $persisted: Preset<DataValue, keyof DataValue>;
        $owner: Preset<DataValue, keyof DataValue>;
    };
}

type D2EventFields = Selector<D2EventSchema>;

type GetEvent<Fields> = SelectedPick<D2EventSchema, Fields>;

export type EventStatus = "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULED" | "OVERDUE" | "SKIPPED";

export interface D2EventToPost {
    event?: string;
    orgUnit: string;
    program: string;
    status: EventStatus;
    eventDate: string;
    coordinate?: {
        latitude: number;
        longitude: number;
    };
    attributeOptionCombo?: string;
    trackedEntityInstance?: string;
    programStage?: string;
    dataValues: Array<{
        dataElement: string;
        value: string | number | boolean;
    }>;
}
export interface EventsPostRequest {
    events: D2EventToPost[];
}

export type EventsPostParams = Partial<{
    idScheme: IdScheme;
    dataElementIdScheme: IdScheme;
    orgUnitIdScheme: IdScheme;
    eventIdScheme: IdScheme;
    preheatCache: boolean;
    skipExistingCheck: boolean;
    payloadFormat: "json" | "xml" | "csv";
    async: boolean;
    dryRun: boolean;
    strategy: "CREATE" | "UPDATE" | "CREATE_AND_UPDATE" | "DELETE";
}>;

export type IdScheme = string;

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

export type EventsGetRequestFilters<Fields> = EventsGetRequest<Fields>;

export interface EventsGetRequest<Fields> {
    fields: Fields;
    program?: string;
    orgUnit?: string;
    event?: string;
    programStage?: string;
    programStatus?: "ACTIVE" | "COMPLETED" | "CANCELLED";
    followUp?: boolean;
    trackedEntityInstance?: string;
    ouMode?: "SELECTED" | "CHILDREN" | "DESCENDANTS";
    startDate?: string;
    endDate?: string;
    status?: "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULED" | "OVERDUE" | "SKIPPED";
    lastUpdated?: string;
    lastUpdatedStartDate?: string;
    lastUpdatedEndDate?: string;
    lastUpdatedDuration?: string;
    skipMeta?: boolean;
    page?: number;
    pageSize?: number;
    totalPages?: boolean;
    skipPaging?: boolean;
    dataElementIdScheme?: IdScheme;
    categoryOptionComboIdScheme?: IdScheme;
    orgUnitIdScheme?: IdScheme;
    programIdScheme?: IdScheme;
    programStageIdScheme?: IdScheme;
    idScheme?: IdScheme;
    order?: string;
    skipEventId?: boolean;
    attributeCc?: string;
    attributeCos?: string;
    async?: boolean;
    includeDeleted?: boolean;
    assignedUserMode?: boolean;
    assignedUser?: string;
    filter?: string; // <data-element-id>:<operator>:<filter>[:<operator>:<filter>]
}

export interface EventsGetResponse<Fields> {
    events: GetEvent<Fields>[];
}

export interface PaginatedEventsGetResponse<Fields> extends EventsGetResponse<Fields> {
    pager: Pager;
}

// The two kind of events (capture and tracker) use the same endpoint, so we must define
// the Event type with some optional properries.
export interface D2Event {
    attributeCategoryOptions: string;
    attributeOptionCombo: Id;
    created: DateString;
    createdByUserInfo?: UserInfo;
    coordinate?: { latitude: number; longitude: number };
    dataValues: DataValue[];
    deleted: boolean;
    dueDate: DateString;
    enrollment?: Id;
    enrollmentStatus?: "ACTIVE" | "COMPLETED" | "CANCELLED";
    event: Id;
    eventDate: DateString;
    followup?: boolean;
    href: string;
    lastUpdated: DateString;
    lastUpdatedByUserInfo?: UserInfo;
    notes?: string;
    orgUnit: Id;
    orgUnitName: string;
    program: Id;
    programStage: Id;
    programType: "WITH_REGISTRATION" | "WITHOUT_REGISTRATION";
    relationships?: D2Relationship[];
    status: EventStatus;
    storedBy: Username;
    trackedEntityInstance?: Id;
}

type DateString = string;

type Username = string;

export interface UserInfo {
    uid: Id;
    username: string;
    firstName: string;
    surname: string;
}

export interface DataValue {
    lastUpdated: string;
    storedBy: string;
    created: string;
    dataElement: string;
    value: string;
    providedElsewhere: boolean;
}
