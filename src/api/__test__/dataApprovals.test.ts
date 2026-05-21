import MockAdapter from "axios-mock-adapter";
import { beforeEach, describe, expect, it } from "vitest";
import { D2Api } from "../../2.42";
import {
    BulkApprovalPayload,
    DataApprovalBulkStatus,
    DataApprovalByCategoryOptionCombo,
    DataApprovalStatus,
} from "../dataApprovals";

const WORKFLOW_ID = "rIUL3hYOjJc";
const WORKFLOW_ID_2 = "lyLU2wR22tC";
const DATASET_ID = "BfMAe6Itzgt";
const DATASET_ID_2 = "pBOMPrpg1QX";
const PERIOD = "201801";
const PERIOD_2 = "201802";
const ORG_UNIT = "YuQRtpLP10I";
const ORG_UNIT_2 = "cDw53Ej8rju";
const AOC = "HllvX50cXC0";
const AOC_2 = "ranftQIH5M9";

function getMockApi(): { api: D2Api; mock: MockAdapter } {
    const api = new D2Api({ backend: "xhr" });
    const mock = api.getMockAdapter();
    return { api, mock };
}

const singleStatusResponse: DataApprovalStatus = {
    mayApprove: false,
    mayUnapprove: true,
    mayAccept: true,
    mayUnaccept: false,
    mayReadData: true,
    state: "APPROVED_HERE",
    approvedBy: "User A",
    approvedAt: "2022-01-13T12:56:07.005",
    acceptedBy: "User A",
    acceptedAt: "2022-01-13T12:56:07.005",
};

const bulkStatusResponse: DataApprovalBulkStatus[] = [
    {
        wf: WORKFLOW_ID,
        pe: PERIOD,
        ou: ORG_UNIT,
        aoc: AOC,
        level: "KaTJLhGmU95",
        state: "APPROVED_HERE",
        permissions: {
            mayApprove: false,
            mayUnapprove: true,
            mayAccept: true,
            mayUnaccept: false,
            mayReadData: true,
            approvedBy: "User A",
            approvedAt: "2022-01-13T12:56:07.005",
            acceptedBy: "User A",
            acceptedAt: "2022-01-13T12:56:07.005",
        },
    },
    {
        wf: WORKFLOW_ID,
        pe: PERIOD_2,
        ou: ORG_UNIT,
        aoc: AOC,
        state: "UNAPPROVED_READY",
        permissions: {
            mayApprove: true,
            mayUnapprove: false,
            mayAccept: false,
            mayUnaccept: false,
            mayReadData: true,
        },
    },
];

const categoryOptionComboResponse: DataApprovalByCategoryOptionCombo[] = [
    {
        id: AOC,
        level: { id: "KaTJLhGmU95" },
        ou: ORG_UNIT,
        accepted: true,
        permissions: {
            mayApprove: false,
            mayUnapprove: true,
            mayAccept: false,
            mayUnaccept: true,
            mayReadData: true,
        },
    },
];

function mockRequest(
    mock: MockAdapter,
    method: "get" | "post" | "delete",
    url: string,
    response: unknown = undefined
): void {
    const adapter = {
        get: mock.onGet.bind(mock),
        post: mock.onPost.bind(mock),
        delete: mock.onDelete.bind(mock),
    }[method];
    adapter(url).reply(200, response);
}

describe("DataApprovals", () => {
    let api: D2Api;
    let mock: MockAdapter;

    beforeEach(() => {
        ({ api, mock } = getMockApi());
    });

    describe("get", () => {
        it("fetches single status by workflow", async () => {
            mockRequest(mock, "get", "/dataApprovals", singleStatusResponse);

            const result = await api.dataApprovals
                .get({ wf: WORKFLOW_ID, pe: PERIOD, ou: ORG_UNIT })
                .getData();

            expect(mock.history.get[0].url).toBe("/dataApprovals");
            expect(mock.history.get[0].params).toEqual({
                wf: WORKFLOW_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
            expect(result).toEqual(singleStatusResponse);
        });

        it("fetches single status by legacy data set", async () => {
            mockRequest(mock, "get", "/dataApprovals", singleStatusResponse);

            await api.dataApprovals.get({ ds: DATASET_ID, pe: PERIOD, ou: ORG_UNIT }).getData();

            expect(mock.history.get[0].params).toEqual({
                ds: DATASET_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
        });

        it("forwards optional aoc when provided", async () => {
            mockRequest(mock, "get", "/dataApprovals", singleStatusResponse);

            await api.dataApprovals
                .get({ wf: WORKFLOW_ID, pe: PERIOD, ou: ORG_UNIT, aoc: AOC })
                .getData();

            expect(mock.history.get[0].params).toEqual({
                wf: WORKFLOW_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
                aoc: AOC,
            });
        });
    });

    describe("getMany", () => {
        it("joins array parameters with commas", async () => {
            mockRequest(mock, "get", "/dataApprovals/approvals", bulkStatusResponse);

            const result = await api.dataApprovals
                .getMany({
                    wf: [WORKFLOW_ID, WORKFLOW_ID_2],
                    pe: [PERIOD, PERIOD_2],
                    ou: [ORG_UNIT, ORG_UNIT_2],
                    aoc: [AOC, AOC_2],
                })
                .getData();

            expect(mock.history.get[0].url).toBe("/dataApprovals/approvals");
            expect(mock.history.get[0].params).toEqual({
                wf: `${WORKFLOW_ID},${WORKFLOW_ID_2}`,
                pe: `${PERIOD},${PERIOD_2}`,
                ou: `${ORG_UNIT},${ORG_UNIT_2}`,
                aoc: `${AOC},${AOC_2}`,
            });
            expect(result).toEqual(bulkStatusResponse);
        });

        it("serializes single-item arrays without trailing commas", async () => {
            mockRequest(mock, "get", "/dataApprovals/approvals", bulkStatusResponse);

            await api.dataApprovals
                .getMany({ wf: [WORKFLOW_ID], pe: [PERIOD], ou: [ORG_UNIT] })
                .getData();

            expect(mock.history.get[0].params).toEqual({
                wf: WORKFLOW_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
        });

        it("serializes legacy ds arrays as CSV", async () => {
            mockRequest(mock, "get", "/dataApprovals/approvals", bulkStatusResponse);

            await api.dataApprovals
                .getMany({
                    ds: [DATASET_ID, DATASET_ID_2],
                    pe: [PERIOD],
                    ou: [ORG_UNIT],
                })
                .getData();

            expect(mock.history.get[0].params).toEqual({
                ds: `${DATASET_ID},${DATASET_ID_2}`,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
        });
    });

    describe("getByCategoryOptionCombos", () => {
        it("fetches status per attribute option combo", async () => {
            mockRequest(
                mock,
                "get",
                "/dataApprovals/categoryOptionCombos",
                categoryOptionComboResponse
            );

            const result = await api.dataApprovals
                .getByCategoryOptionCombos({
                    wf: WORKFLOW_ID,
                    pe: PERIOD,
                    ou: ORG_UNIT,
                })
                .getData();

            expect(mock.history.get[0].url).toBe("/dataApprovals/categoryOptionCombos");
            expect(mock.history.get[0].params).toEqual({
                wf: WORKFLOW_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
            expect(result).toEqual(categoryOptionComboResponse);
        });
    });

    describe("approve / unapprove", () => {
        it("approves via POST /dataApprovals with selector as query params", async () => {
            mockRequest(mock, "post", "/dataApprovals");

            await api.dataApprovals
                .approve({ wf: WORKFLOW_ID, pe: PERIOD, ou: ORG_UNIT })
                .getData();

            expect(mock.history.post[0].url).toBe("/dataApprovals");
            expect(mock.history.post[0].params).toEqual({
                wf: WORKFLOW_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
        });

        it("unapproves via DELETE /dataApprovals with selector as query params", async () => {
            mockRequest(mock, "delete", "/dataApprovals");

            const result = await api.dataApprovals
                .unapprove({ wf: WORKFLOW_ID, pe: PERIOD, ou: ORG_UNIT })
                .getData();

            expect(mock.history.delete[0].url).toBe("/dataApprovals");
            expect(mock.history.delete[0].params).toEqual({
                wf: WORKFLOW_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
            expect(result).toBeUndefined();
        });

        it("approves using legacy ds selector", async () => {
            mockRequest(mock, "post", "/dataApprovals");

            await api.dataApprovals.approve({ ds: DATASET_ID, pe: PERIOD, ou: ORG_UNIT }).getData();

            expect(mock.history.post[0].params).toEqual({
                ds: DATASET_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
        });
    });

    describe("accept / unaccept", () => {
        it("accepts via POST /dataAcceptances with selector as query params", async () => {
            mockRequest(mock, "post", "/dataAcceptances");

            const result = await api.dataApprovals
                .accept({ wf: WORKFLOW_ID, pe: PERIOD, ou: ORG_UNIT })
                .getData();

            expect(mock.history.post[0].url).toBe("/dataAcceptances");
            expect(mock.history.post[0].params).toEqual({
                wf: WORKFLOW_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
            expect(result).toBeUndefined();
        });

        it("unaccepts via DELETE /dataAcceptances with selector as query params", async () => {
            mockRequest(mock, "delete", "/dataAcceptances");

            const result = await api.dataApprovals
                .unaccept({ wf: WORKFLOW_ID, pe: PERIOD, ou: ORG_UNIT })
                .getData();

            expect(mock.history.delete[0].url).toBe("/dataAcceptances");
            expect(mock.history.delete[0].params).toEqual({
                wf: WORKFLOW_ID,
                pe: PERIOD,
                ou: ORG_UNIT,
            });
            expect(result).toBeUndefined();
        });
    });

    describe("approveMany", () => {
        it("posts to /dataApprovals/approvals with wf payload", async () => {
            mockRequest(mock, "post", "/dataApprovals/approvals");
            const payload: BulkApprovalPayload = {
                wf: [WORKFLOW_ID, WORKFLOW_ID_2],
                pe: [PERIOD, PERIOD_2],
                approvals: [{ ou: ORG_UNIT, aoc: AOC }, { ou: ORG_UNIT, aoc: AOC_2 }],
            };

            await api.dataApprovals.approveMany(payload).getData();

            expect(mock.history.post[0].url).toBe("/dataApprovals/approvals");
            expect(JSON.parse(mock.history.post[0].data)).toEqual(payload);
        });

        it("posts with legacy ds payload", async () => {
            mockRequest(mock, "post", "/dataApprovals/approvals");
            const payload: BulkApprovalPayload = {
                ds: [DATASET_ID],
                pe: [PERIOD],
                approvals: [{ ou: ORG_UNIT, aoc: AOC }],
            };

            await api.dataApprovals.approveMany(payload).getData();

            expect(JSON.parse(mock.history.post[0].data)).toEqual(payload);
        });
    });

    describe("unapproveMany", () => {
        it("posts to /dataApprovals/unapprovals", async () => {
            mockRequest(mock, "post", "/dataApprovals/unapprovals");
            const payload: BulkApprovalPayload = {
                wf: [WORKFLOW_ID],
                pe: [PERIOD],
                approvals: [{ ou: ORG_UNIT, aoc: AOC }],
            };

            await api.dataApprovals.unapproveMany(payload).getData();

            expect(mock.history.post[0].url).toBe("/dataApprovals/unapprovals");
            expect(JSON.parse(mock.history.post[0].data)).toEqual(payload);
        });
    });

    describe("acceptMany", () => {
        it("posts to /dataAcceptances/acceptances", async () => {
            mockRequest(mock, "post", "/dataAcceptances/acceptances");
            const payload: BulkApprovalPayload = {
                wf: [WORKFLOW_ID],
                pe: [PERIOD],
                approvals: [{ ou: ORG_UNIT, aoc: AOC }],
            };

            await api.dataApprovals.acceptMany(payload).getData();

            expect(mock.history.post[0].url).toBe("/dataAcceptances/acceptances");
            expect(JSON.parse(mock.history.post[0].data)).toEqual(payload);
        });
    });

    describe("unacceptMany", () => {
        it("posts to /dataAcceptances/unacceptances", async () => {
            mockRequest(mock, "post", "/dataAcceptances/unacceptances");
            const payload: BulkApprovalPayload = {
                wf: [WORKFLOW_ID],
                pe: [PERIOD],
                approvals: [{ ou: ORG_UNIT, aoc: AOC }],
            };

            await api.dataApprovals.unacceptMany(payload).getData();

            expect(mock.history.post[0].url).toBe("/dataAcceptances/unacceptances");
            expect(JSON.parse(mock.history.post[0].data)).toEqual(payload);
        });
    });
});
