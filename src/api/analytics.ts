import { Id } from "../schemas";
import { EmptyObject } from "../utils/types";
import { D2ApiResponse, HttpResponse } from "./common";
import { D2ApiGeneric } from "./d2Api";

type Operator = "EQ" | "GT" | "GE" | "LT" | "LE";

type ColumnsSeparatedBySemicolon = string;

type RowsSeparatedBySemicolon = string;

type UserOrgUnitSeparatedBySemicolon = string;

export type AnalyticsOptions = {
    /** Dimensions and dimension items to be retrieved, repeated for each */
    dimension: string[];

    /** Filters and filter items to apply to the query, repeated for each. */
    filter?: string[];

    /** Aggregation type to use in the aggregation process. */
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

    /** Filters for the data/measures. */
    measureCriteria?: Operator;

    /** Filters for the data/measure, applied before aggregation is performed. */
    preAggregationMeasureCriteria?: Operator;

    /** Start date for a date range. Will be applied as a filter. Can not be used together with a period dimension or filter. (yyyy-MM-dd) */
    startDate?: string;

    /** End date for date range. Will be applied as a filter. Can not be used together with a period dimension or filter. (yyyy-MM-dd) */
    endDate?: string;

    /** Exclude the metadata part of the response (improves performance). */
    skipMeta?: boolean;

    /** Exclude the data part of the response. */
    skipData?: boolean;

    /** Skip rounding of data values, i.e. provide full precision. */
    skipRounding?: boolean;

    /** Include names of organisation unit ancestors and hierarchy paths of organisation units in the metadata. */
    hierarchyMeta?: boolean;

    /** Ignore limit on max 50 000 records in response - use with care. */
    ignoreLimit?: boolean;

    /** Use plain data source or table layout for the response.	 */
    tableLayout?: boolean;

    /** Hides empty rows in response, applicable when table layout is true. */
    hideEmptyRows?: boolean;

    /** Hides empty columns in response, applicable when table layout is true. */
    hideEmptyColumns?: boolean;

    /** Display full org unit hierarchy path together with org unit name. */
    showHierarchy?: boolean;

    /** Include the numerator and denominator used to calculate the value in the response. */
    includeNumDen?: boolean;

    /** Include metadata details to raw data response. */
    includeMetadataDetails?: boolean;

    /** Property to display for metadata. */
    displayProperty?: "NAME" | "SHORTNAME";

    /** Identifier scheme used for metadata items in the query response. It accepts identifier, code or attributes. */
    outputIdScheme?: string;

    /** Identifier scheme to use for metadata items in the query request, can be an identifier, code or attributes. */
    inputIdScheme?: string;

    /** Include data which has been approved at least up to the given approval level, refers to identifier of approval level. */
    approvalLevel?: string;

    /** Date used as basis for relative periods. */
    relativePeriodDate?: string;

    /** Explicitly define the user org units to utilize, overrides organisation units associated with the current user, multiple identifiers can be separated by semicolon. */
    userOrgUnit?: UserOrgUnitSeparatedBySemicolon;

    /** Dimensions to use as columns for table layout. */
    columns?: ColumnsSeparatedBySemicolon;

    /** Dimensions to use as rows for table layout. */
    rows?: RowsSeparatedBySemicolon;

    /** Specify the ordering of rows based on value. */
    order?: "ASC" | "DESC";

    /** The time field to base event aggregation on. Applies to event data items only. Can be a predefined option or the ID of an attribute or data element with a time-based value type. */
    timeField?: string;

    /** The organisation unit field to base event aggregation on. Applies to event data items only. Can be the ID of an attribute or data element with the Organisation unit value type. The default option is specified as omitting the query parameter. */
    orgUnitField?: string;

    /** Custom period on enrollmentDate */
    enrollmentDate?: string;
};

type KnownAscDescValues =
    | "ouname"
    | "programstatus"
    | "createdbydisplayname"
    | "lastupdatedbydisplayname"
    | "enrollmentdate"
    | "incidentdate"
    | "lastupdated";

type AscDescParameter = KnownAscDescValues | Id;

type PageOptions = {
    totalPages: boolean;
    page: number;
    pageSize: number;
    paging: boolean;
};

type HeadersSeparatedByCommas = string;

export type GetEnrollmentsQueryOptions = {
    programId: Id;
    programStatus?: "ACTIVE" | "COMPLETED" | "CANCELLED";
    ouMode?: "DESCENDANTS" | "CHILDREN" | "SELECTED";
    asc?: AscDescParameter;
    desc?: AscDescParameter;
    coordinatesOnly?: boolean;
    headers?: HeadersSeparatedByCommas;
} & AnalyticsOptions &
    Partial<PageOptions>;

type PaginationOptions = Pick<GetEnrollmentsQueryOptions, "paging" | "totalPages" | "skipMeta">;

type PagerWithoutTotals = { page: number; pageSize: number; isLastPage: boolean };

type PagerWithTotals = { page: number; pageCount: number; pageSize: number; total: number };

type MetadataPager<Options extends PaginationOptions> = Options["paging"] extends false
    ? undefined
    : (Options["totalPages"] extends true ? PagerWithTotals : PagerWithoutTotals);

export type AnalyticsResponse = {
    headers: Array<{
        name: string;
        column: string;
        valueType: string;
        type: string;
        hidden: boolean;
        meta: boolean;
    }>;
    metaData:
        | EmptyObject
        | {
              dimensions: Record<string, string[]>;
              items: Record<string, { name: string; uid?: Id; code?: string; options: any[] }>;
          };

    rows: Array<string[]>;
    width: number;
    height: number;
};

type AnalyticsResponseWithPager<Options extends GetEnrollmentsQueryOptions> = AnalyticsResponse & {
    metaData: { pager: MetadataPager<Options> };
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
    /** Skip generation of resource tables */
    skipResourceTables?: boolean;

    /** Skip generation of aggregate data and completeness data */
    skipAggregate?: boolean;

    /** Skip generation of event data */
    skipEvents?: boolean;

    /** Skip generation of enrollment data */
    skipEnrollment?: boolean;

    /** Skip generation of organization unit ownership data */
    skipOrgUnitOwnership?: boolean;

    /** Number of last years of data to include */
    lastYears?: number;
};

export class Analytics {
    constructor(public d2Api: D2ApiGeneric) {}

    get(options: AnalyticsOptions): D2ApiResponse<AnalyticsResponse> {
        return this.d2Api.get<AnalyticsResponse>("/analytics", options);
    }

    // https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-240/analytics.html#webapi_enrollment_analytics
    getEnrollmentsQuery<Options extends GetEnrollmentsQueryOptions>(
        options: Options
    ): D2ApiResponse<AnalyticsResponseWithPager<Options>> {
        return this.d2Api.get<AnalyticsResponseWithPager<Options>>(
            `/analytics/enrollments/query/${options.programId}`,
            options
        );
    }

    run(options?: RunAnalyticsOptions): D2ApiResponse<RunAnalyticsResponse> {
        return this.d2Api.post<RunAnalyticsResponse>("/resourceTables/analytics", options);
    }
}
