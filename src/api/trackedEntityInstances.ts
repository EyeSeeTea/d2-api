import { D2Geometry, D2ProgramOwner } from "../schemas";
import { PartialBy } from "../utils/types";
import { Id, Pager } from "./base";
import { AsyncPostResponse, D2ApiResponse, HttpResponse } from "./common";
import { D2ApiGeneric } from "./d2Api";
import { D2Event, D2EventToPost } from "./events";

export class TrackedEntityInstances {
    constructor(public d2Api: D2ApiGeneric) {}

    get(params: TeiGetRequest): D2ApiResponse<PaginatedTeiGetResponse> {
        return this.d2Api.get<PaginatedTeiGetResponse>("/trackedEntityInstances", {
            ...params,
            ou: params.ou ? params.ou.join(";") : undefined,
            skipPaging: false,
        });
    }

    getAll(params: TeiGetRequest): D2ApiResponse<TeiGetResponse> {
        return this.d2Api.get<TeiGetResponse>("/trackedEntityInstances", {
            ...params,
            ou: params.ou ? params.ou.join(";") : undefined,
            skipPaging: true,
            page: undefined,
            pageSize: undefined,
        });
    }

    post(
        params: TeiPostParams,
        request: TeiPostRequest
    ): D2ApiResponse<HttpResponse<TeiPostResponse>> {
        return this.d2Api.post<HttpResponse<TeiPostResponse>>(
            "/trackedEntityInstances",
            { ...params, async: false },
            request
        );
    }

    postAsync(
        params: TeiPostParams,
        request: TeiPostRequest
    ): D2ApiResponse<AsyncPostResponse<"TEI_IMPORT">> {
        return this.d2Api.post<AsyncPostResponse<"TEI_IMPORT">>(
            "/trackedEntityInstances",
            { ...params, async: true },
            request
        );
    }
}

interface TrackedEntityInstanceBase {
    trackedEntityInstance: Id;
    trackedEntityType: Id;
    inactive?: boolean;
    orgUnit: Id;
    attributes: Attribute[];
    enrollments: Enrollment[];
    relationships: Relationship[];
    created: string;
    createdAtClient: string;
    lastUpdated: string;
    programOwners: D2ProgramOwner[];
}

type TeiPartial = PartialBy<
    TrackedEntityInstance,
    Exclude<keyof TrackedEntityInstance, "trackedEntityInstance" | "orgUnit">
>;

export interface TrackedEntityInstanceToPost extends Omit<TeiPartial, "enrollments"> {
    enrollments: EnrollmentToPost[];
}

export type TrackedEntityInstance = TeiGeometryNone | TeiGeometryPoint | TeiGeometryPolygon;

interface GeometryNone {
    featureType: "NONE";
}

interface GeometryPoint {
    featureType: "POINT";
    geometry: Extract<D2Geometry, { type: "Point" }>;
}

interface GeometryPolygon {
    featureType: "POLYGON";
    geometry: Extract<D2Geometry, { type: "Polygon" }>;
}

export type TrackedEntityInstanceGeometryAttributes =
    | GeometryNone
    | GeometryPoint
    | GeometryPolygon;

type TeiGeometryNone = TrackedEntityInstanceBase & GeometryNone;

type TeiGeometryPoint = TrackedEntityInstanceBase & GeometryPoint;

type TeiGeometryPolygon = TrackedEntityInstanceBase & GeometryPolygon;

export interface Relationship {
    relationship: Id;
    relationshipType: Id;
    relationshipName: string;
    from: RelationshipItem;
    to: RelationshipItem;
}

export interface RelationshipItem {
    trackedEntityInstance?: {
        trackedEntityInstance: Id;
    };
    event?: { event: Id };
}

export interface Enrollment {
    enrollment: Id;
    program: Id;
    orgUnit: Id;
    enrollmentDate: string;
    incidentDate: string;
    events?: D2Event[];
}

export interface EnrollmentToPost extends Omit<Enrollment, "events"> {
    enrollment: Id;
    program: Id;
    orgUnit: Id;
    enrollmentDate: string;
    incidentDate: string;
    events?: D2EventToPost[];
}

export interface AttributeValue {
    attribute: Attribute;
    value: string;
    optionId?: Id;
}

export interface Attribute {
    attribute: Id;
    valueType?: string;
    value: string;
}

export type TeiOuRequest =
    | { ouMode?: "ACCESSIBLE" | "CAPTURE" | "ALL"; ou?: never[] }
    | { ouMode?: "SELECTED" | "CHILDREN" | "DESCENDANTS"; ou: Id[] };

export type TeiGetRequest = TeiOuRequest & {
    // Program and tracked entity type cannot be specified simultaneously
    program?: Id;
    trackedEntityType?: Id;
    programStatus?: "ACTIVE" | "COMPLETED" | "CANCELLED";
    followUp?: boolean;
    order?: string;
    pageSize?: number;
    page?: number;
    totalPages: true;
    fields?: string; // TODO: Add inference
    programStartDate?: string;
    programEndDate?: string;
    lastUpdatedStartDate?: string;
    lastUpdatedEndDate?: string;
    lastUpdatedDuration?: string;
    assignedUserMode?: "CURRENT" | "PROVIDED" | "NONE" | "ANY";
    trackedEntityInstance?: string;
    includeDeleted?: boolean;
};

export interface TeiGetResponse {
    trackedEntityInstances: TrackedEntityInstance[];
}

export interface PaginatedTeiGetResponse extends TeiGetResponse {
    pager: Pager;
}

export interface TeiPostRequest {
    trackedEntityInstances: TrackedEntityInstanceToPost[];
}

export type TeiPostParams = Partial<{
    idScheme: string;
    dataElementIdScheme: string;
    orgUnitIdScheme: string;
    skipNotifications: boolean;
    skipFirst: boolean;
    strategy: "CREATE" | "UPDATE" | "CREATE_AND_UPDATE" | "DELETE";
    importReportMode: "FULL" | "ERRORS" | "DEBUG";
    async: boolean;
    dryRun: boolean;
}>;

export interface TeiPostResponse {
    responseType: "ImportSummaries";
    status: "ERROR" | "SUCCESS";
    imported: number;
    updated: number;
    deleted: number;
    ignored: number;
    total: number;
    importSummaries?: Array<
        | {
              responseType: "ImportSummary";
              status: "ERROR";
              reference?: string;
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
              importCount: {
                  imported: number;
                  updated: number;
                  ignored: number;
                  deleted: number;
              };
              enrollments: {
                  responseType: "ImportSummaries";
                  status: "ERROR" | "SUCCESS";
                  imported: number;
                  updated: number;
                  deleted: number;
                  ignored: number;
                  total: number;
              };
          }
    >;
}
