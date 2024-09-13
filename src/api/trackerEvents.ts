import { D2ApiGeneric } from "./d2Api";
import { Id, Selector, D2ApiResponse, SelectedPick } from "./base";
import { Preset, FieldPresets, D2Geometry } from "../schemas";
import { getFieldsAsString } from "./common";
import _ from "lodash";

export class TrackerEvents {
    constructor(public api: D2ApiGeneric) {}

    get<Fields extends D2TrackerEventFields>(
        params: EventsParams<Fields>
    ): D2ApiResponse<TrackerEventsResponse<Fields>> {
        return this.api.get<TrackerEventsResponse<Fields>>("/tracker/events", {
            ..._.omit(params, ["fields"]),
            fields: getFieldsAsString(params.fields),
        });
    }

    getById<Fields extends D2TrackerEventFields>(
        id: string,
        params: EventsParams<Fields>
    ): D2ApiResponse<D2TrackerEvent> {
        return this.api.get<D2TrackerEvent>(`/tracker/events/${id}`, {
            ..._.omit(params, ["fields"]),
            fields: getFieldsAsString(params.fields),
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
    programStage?: Id;
    enrollment?: Id;
    enrollmentStatus?: "ACTIVE" | "COMPLETED" | "CANCELLED";
    orgUnit: Id;
    orgUnitName: string;
    relationships: [];
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
    notes: [];
    trackedEntity?: Id;
}

export type D2TrackerEvent = TrackedEntityGeometryPoint | TrackedEntityGeometryPolygon;

interface GeometryPoint {
    geometry?: Extract<D2Geometry, { type: "Point" }>;
}

interface GeometryPolygon {
    geometry?: Extract<D2Geometry, { type: "Polygon" }>;
}

type TrackedEntityGeometryPoint = D2TrackerEventBase & GeometryPoint;

type TrackedEntityGeometryPolygon = D2TrackerEventBase & GeometryPolygon;

type EventsParams<Fields> = EventsParamsBase & { fields: Fields } & Partial<{
        totalPages: boolean;
        page: number;
        pageSize: number;
        skipPaging: boolean;
    }>;

interface EventsParamsBase {
    program?: Id;
    programStage?: Id;
    programStatus?: ProgramStatus;
    filter?: CommaDelimitedListOfDataElementFilter;
    filterAttributes?: CommaDelimitedListOfAttributeFilter;
    followUp?: boolean;
    trackedEntity?: Id;
    orgUnit?: Id;
    event?: Id;
    ouMode?: "SELECTED" | "CHILDREN" | "DESCENDANTS";
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

interface D2EventDataValueSchema {
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

export interface DataValue {
    updatedAt?: IsoDate;
    storedBy?: Username;
    createdAt?: IsoDate;
    dataElement: Id;
    value: string;
    providedElsewhere?: boolean;
}

export interface TrackerEventsResponse<Fields> {
    page: number;
    pageSize: number;
    instances: SelectedPick<D2TrackerEventSchema, Fields>[];
    total?: number; // Only if requested with totalPages=true
}

export interface D2TrackerEventSchema {
    name: "D2TrackerEvent";
    model: D2TrackerEvent;
    fields: D2TrackerEvent & {
        dataValues: D2EventDataValueSchema[];
    };
    fieldPresets: {
        $all: Preset<D2TrackerEvent, keyof D2TrackerEvent>;
        $identifiable: Preset<D2TrackerEvent, FieldPresets["identifiable"]>;
        $nameable: Preset<D2TrackerEvent, FieldPresets["nameable"]>;
        $persisted: Preset<D2TrackerEvent, never>;
        $owner: Preset<D2TrackerEvent, never>;
    };
}

type D2TrackerEventFields = Selector<D2TrackerEventSchema>;
