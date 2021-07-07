import { D2ApiGeneric, Id, Ref } from "..";
import { D2ApiResponse } from "./common";
import { PaginatedObjects, Pager } from ".";

// https://docs.dhis2.org/en/develop/using-the-api/dhis-core-version-master/audit.html

export class Audit {
    constructor(public d2Api: D2ApiGeneric) {}

    /* Return paginated audits for data values */
    getDataValues(
        options: DataValuesAuditOptions
    ): D2ApiResponse<PaginatedObjects<DataValueAudit>> {
        return this.d2Api
            .get<GetDataValueAuditResponse>("/audits/dataValue", { ...options, paging: true })
            .map(({ data }) => ({ pager: data.pager, objects: data.dataValueAudits }));
    }
}

export type AuditType = "UPDATE" | "DELETE";

// Apparently, the official docs are wrong (they reference a skipPaging property).
// Standard properties paging/page/pageSize work.
export type DataValuesAuditOptions = {
    ds?: Id[];
    de?: Id[];
    pe?: string[];
    ou?: Id[];
    auditType?: AuditType;
    // paging: boolean;
    page?: number;
    pageSize?: number;
};

export interface GetDataValueAuditResponse {
    pager: Pager;
    dataValueAudits: DataValueAudit[];
}

export interface DataValueAudit {
    created: string;
    modifiedBy: string;
    auditType: AuditType;
    value: string;
    period: { id: string };
    organisationUnit: Ref;
    attributeOptionCombo: Ref;
    categoryOptionCombo: Ref;
    dataElement: Ref;
}
