import { D2ApiGeneric } from "./d2Api";
import { Id, Selector, D2ApiResponse } from "./base";
import { Preset, FieldPresets } from "../schemas";
import { getFieldsAsString } from "./common";
import { D2Relationship, D2RelationshipSchema } from "../2.36";
import { D2EventDataValueSchema, EventStatus, IdScheme } from "./events";
import _ from "lodash";

export class TrackerEvents {
    constructor(public api: D2ApiGeneric) {}

    get<Fields extends D2TrackerEventFields>(
        params: EventsParams<Fields>
    ): D2ApiResponse<TrackerEventsResponse> {
        return this.api.get<TrackerEventsResponse>("/tracker/events", {
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

export interface D2TrackerEvent {
    event: Id;
    status: EventStatus;
    program: Id;
    programStage: Id;
    enrollment: Id;
    orgUnit: Id;
    orgUnitName: string;
    relationships: D2Relationship[];
    occurredAt: IsoDate;
    scheduledAt: IsoDate;
    storedBy: Username;
    followup: boolean;
    deleted: boolean;
    createdAt: IsoDate;
    updatedAt: IsoDate;
    attributeOptionCombo: Id;
    attributeCategoryOptions: Id;
    updatedBy: Username;
    dataValues: DataValue[];
    notes: string;
}

export interface EventsParams<Fields> {
    fields: Fields;
    program?: Id;
    programStage?: Id;
    programStatus?: ProgramStatus;
    filter?: CommaDelimitedListOfDataElementFilter;
    filterAttributes?: CommaDelimitedListOfAttributeFilter;
    followUp?: boolean;
    trackedEntity?: Id;
    orgUnit?: Id;
    event?: string;
    ouMode?: "SELECTED" | "CHILDREN" | "DESCENDANTS";
    status?: "ACTIVE" | "COMPLETED" | "VISITED" | "SCHEDULED" | "OVERDUE" | "SKIPPED";
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

interface DataValue {
    updatedAt: IsoDate;
    storedBy?: Username;
    createdAt: IsoDate;
    dataElement: Id;
    value: string | number | boolean;
    providedElsewhere: boolean;
}

export interface TrackerEventsResponse {
    page: number;
    pageSize: number;
    instances: D2TrackerEvent[];
    total?: number; // Only if requested with totalPages=true
}

interface D2TrackerEventSchema {
    name: "D2TrackerEvent";
    model: D2TrackerEvent;
    fields: D2TrackerEvent & {
        dataValues: D2EventDataValueSchema[];
        relationships: D2RelationshipSchema[];
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
