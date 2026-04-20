import { Id } from "../schemas";
import { RequireAtLeastOne } from "../utils/types";
import { D2ApiResponse, Params } from "./common";
import { D2ApiGeneric } from "./d2Api";

export const dataApprovalStates = [
    "UNAPPROVABLE",
    "UNAPPROVED_WAITING",
    "UNAPPROVED_ELSEWHERE",
    "UNAPPROVED_READY",
    "APPROVED_HERE",
    "APPROVED_ELSEWHERE",
    "ACCEPTED_HERE",
    "ACCEPTED_ELSEWHERE",
] as const;

export type DataApprovalState = (typeof dataApprovalStates)[number];

type WorkflowOrDataSet<T extends { wf?: unknown; ds?: unknown }> = RequireAtLeastOne<
    T,
    "wf" | "ds"
>;

export type ApprovalSelector = WorkflowOrDataSet<{
    wf?: Id;
    ds?: Id;
    pe: string;
    ou: Id;
    aoc?: Id;
}>;

export type BulkApprovalSelector = WorkflowOrDataSet<{
    wf?: Id[];
    ds?: Id[];
    pe: string[];
    ou: Id[];
    aoc?: Id[];
}>;

export type BulkApprovalPayload = WorkflowOrDataSet<{
    wf?: Id[];
    ds?: Id[];
    pe: string[];
    approvals: { ou: Id; aoc: Id }[];
}>;

export interface DataApprovalStatus {
    readonly mayApprove: boolean;
    readonly mayUnapprove: boolean;
    readonly mayAccept: boolean;
    readonly mayUnaccept: boolean;
    readonly state: DataApprovalState;
    readonly approvedBy?: string;
    readonly approvedAt?: string;
    readonly acceptedBy?: string;
    readonly acceptedAt?: string;
}

export interface DataApprovalPermissions {
    readonly mayApprove: boolean;
    readonly mayUnapprove: boolean;
    readonly mayAccept: boolean;
    readonly mayUnaccept: boolean;
    readonly mayReadData: boolean;
    readonly approvedBy?: string;
    readonly approvedAt?: string;
    readonly acceptedBy?: string;
    readonly acceptedAt?: string;
}

export interface DataApprovalBulkStatus {
    readonly wf: Id;
    readonly pe: string;
    readonly ou: Id;
    readonly aoc: Id;
    readonly level?: Id;
    readonly state: DataApprovalState;
    readonly permissions: DataApprovalPermissions;
}

export interface DataApprovalByCategoryOptionCombo {
    readonly id: Id;
    readonly level?: Id;
    readonly ou: Id;
    readonly accepted: boolean;
    readonly permissions: DataApprovalPermissions;
}

type CsvParamValue = string | ReadonlyArray<string> | undefined;

function toCsvParams(params: Readonly<Record<string, CsvParamValue>>): Params {
    return Object.fromEntries(
        Object.entries(params).flatMap(
            ([key, value]): Array<[string, string]> => {
                if (value === undefined) return [];
                if (typeof value === "string") return [[key, value]];
                if (value.length === 0) return [];
                return [[key, value.join(",")]];
            }
        )
    );
}

export class DataApprovals {
    constructor(public d2Api: D2ApiGeneric) {}

    get(params: ApprovalSelector): D2ApiResponse<DataApprovalStatus> {
        return this.d2Api.get<DataApprovalStatus>("/dataApprovals", toCsvParams(params));
    }

    getMany(params: BulkApprovalSelector): D2ApiResponse<DataApprovalBulkStatus[]> {
        return this.d2Api.get<DataApprovalBulkStatus[]>(
            "/dataApprovals/approvals",
            toCsvParams(params)
        );
    }

    getByCategoryOptionCombos(
        params: ApprovalSelector
    ): D2ApiResponse<DataApprovalByCategoryOptionCombo[]> {
        return this.d2Api.get<DataApprovalByCategoryOptionCombo[]>(
            "/dataApprovals/categoryOptionCombos",
            toCsvParams(params)
        );
    }

    approve(params: ApprovalSelector): D2ApiResponse<void> {
        return this.d2Api.post<void>("/dataApprovals", toCsvParams(params));
    }

    unapprove(params: ApprovalSelector): D2ApiResponse<void> {
        return this.d2Api.delete<void>("/dataApprovals", toCsvParams(params));
    }

    accept(params: ApprovalSelector): D2ApiResponse<void> {
        return this.d2Api.post<void>("/dataAcceptances", toCsvParams(params));
    }

    unaccept(params: ApprovalSelector): D2ApiResponse<void> {
        return this.d2Api.delete<void>("/dataAcceptances", toCsvParams(params));
    }

    approveMany(payload: BulkApprovalPayload): D2ApiResponse<void> {
        return this.d2Api.post<void>("/dataApprovals/approvals", {}, payload);
    }

    unapproveMany(payload: BulkApprovalPayload): D2ApiResponse<void> {
        return this.d2Api.post<void>("/dataApprovals/unapprovals", {}, payload);
    }

    acceptMany(payload: BulkApprovalPayload): D2ApiResponse<void> {
        return this.d2Api.post<void>("/dataAcceptances/acceptances", {}, payload);
    }

    unacceptMany(payload: BulkApprovalPayload): D2ApiResponse<void> {
        return this.d2Api.post<void>("/dataAcceptances/unacceptances", {}, payload);
    }
}
