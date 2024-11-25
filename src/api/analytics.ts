import { Id } from "../schemas";
import { EmptyObject } from "../utils/types";
import { D2ApiResponse, HttpResponse } from "./common";
import { D2ApiGeneric } from "./d2Api";
import { Pager } from "./model";

type Operator = "EQ" | "GT" | "GE" | "LT" | "LE";

export type AnalyticsOptions = {
    dimension: string[];
    filter?: string[];
    aggregationType?:
        | "SUM"
        | "AVERAGE"
        | "AVERAGE_SUM_ORG_UNIT"
        | "LAST"
        | "LAST_AVERAGE_ORG_UNIT"
        | "COUNT"
        | "STDDEV"
        | "VARIANCE"
        | "MIN"
        | "MAX";
    measureCriteria?: Operator;
    preAggregationMeasureCriteria?: Operator;
    startDate?: string;
    endDate?: string;
    skipMeta?: boolean;
    skipData?: boolean;
    skipRounding?: boolean;
    hierarchyMeta?: boolean;
    ignoreLimit?: boolean;
    tableLayout?: boolean;
    hideEmptyRows?: boolean;
    hideEmptyColumns?: boolean;
    showHierarchy?: boolean;
    includeNumDen?: boolean;
    includeMetadataDetails?: boolean;
    displayProperty?: "NAME" | "SHORTNAME";
    outputIdScheme?: string;
    inputIdScheme?: string;
    approvalLevel?: string;
    relativePeriodDate?: string;
    userOrgUnit?: string;
    columns?: string;
    rows?: string;
    order?: "ASC" | "DESC";
    timeField?: string;
    orgUnitField?: string;
    enrollmentDate?: string;
};

export type GetEnrollmentsQueryOptions = {
    programId: Id;
} & AnalyticsOptions;
export type AnalyticsResponse = {
    headers: Array<{
        name: "dx" | "dy";
        column: "Data";
        valueType: "TEXT" | "NUMBER";
        type: "java.lang.String" | "java.lang.Double";
        hidden: boolean;
        meta: boolean;
    }>;
    metaData:
        | EmptyObject
        | {
              dimensions: Record<string, string[]>;
              items: Record<string, { name: string; uid?: Id; code?: string; options: any[] }>;
              pager?: Pager;
          };
    rows: Array<string[]>;
    width: number;
    height: number;
};

export type RunAnalyticsResponse = HttpResponse<{
    id: string;
    created: string;
    name: "inMemoryAnalyticsJob";
    jobType: "ANALYTICS_TABLE";
    jobStatus: "SCHEDULED";
    jobParameters: {
        skipResourceTables: boolean;
    };
    relativeNotifierEndpoint: string;
}>;

export type RunAnalyticsOptions = {
    skipResourceTables?: boolean;
    skipAggregate?: boolean;
    skipEvents?: boolean;
    skipEnrollment?: boolean;
    lastYears?: number;
};

export class Analytics {
    constructor(public d2Api: D2ApiGeneric) {}

    get(options: AnalyticsOptions): D2ApiResponse<AnalyticsResponse> {
        return this.d2Api.get<AnalyticsResponse>("/analytics", options);
    }

    // https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-240/analytics.html#webapi_enrollment_analytics
    getEnrollmentsQuery({
        programId,
        ...options
    }: GetEnrollmentsQueryOptions): D2ApiResponse<AnalyticsResponse> {
        return this.d2Api.get<AnalyticsResponse>(
            `/analytics/enrollments/query/${programId}`,
            options as AnalyticsOptions
        );
    }

    run(options?: RunAnalyticsOptions): D2ApiResponse<RunAnalyticsResponse> {
        return this.d2Api.post<RunAnalyticsResponse>("/resourceTables/analytics", options);
    }
}
