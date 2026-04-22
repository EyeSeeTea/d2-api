import { describe, it, expect, beforeAll, expectTypeOf } from "vitest";
import { getPlayD2Api, playFixtures } from "../testing";
import { D2Api } from "../2.42";

describe("TrackedEntities.get against play.dhis2.org/42", () => {
    let api: D2Api;

    beforeAll(() => {
        api = getPlayD2Api();
    });

    it("returns a pager + trackedEntities array for the Child Programme", async () => {
        const response = await api.tracker.trackedEntities
            .get({
                program: playFixtures.program,
                orgUnits: playFixtures.orgUnit,
                orgUnitMode: "DESCENDANTS",
                pageSize: 2,
                fields: { trackedEntity: true, orgUnit: true },
            })
            .getData();

        expect(response.pager.page).toBe(1);
        expect(response.pager.pageSize).toBe(2);
        expect(response.trackedEntities.length).toBeGreaterThan(0);
    });

    it("narrows the result set when enrollmentStatus=COMPLETED", async () => {
        const baseParams = {
            program: playFixtures.program,
            orgUnits: playFixtures.orgUnit,
            orgUnitMode: "DESCENDANTS" as const,
            pageSize: 5,
            totalPages: true,
            fields: { trackedEntity: true },
        };

        const unfiltered = await api.tracker.trackedEntities.get(baseParams).getData();
        const filtered = await api.tracker.trackedEntities
            .get({ ...baseParams, enrollmentStatus: "COMPLETED" })
            .getData();

        expect(unfiltered.pager.total).toBeGreaterThan(0);
        expect(filtered.pager.total).toBeGreaterThan(0);
        expect(filtered.pager.total).toBeLessThanOrEqual(unfiltered.pager.total || 0);
    });

    it("accepts idScheme=UID and orgUnitIdScheme=UID without error", async () => {
        const response = await api.tracker.trackedEntities
            .get({
                program: playFixtures.program,
                orgUnits: playFixtures.orgUnit,
                orgUnitMode: "DESCENDANTS",
                idScheme: "UID",
                orgUnitIdScheme: "UID",
                pageSize: 1,
                fields: { trackedEntity: true, orgUnit: true },
            })
            .getData();

        expect(response.trackedEntities.length).toBe(1);
    });

    it("accepts assignedUserMode=ALL without error", async () => {
        const response = await api.tracker.trackedEntities
            .get({
                program: playFixtures.program,
                orgUnits: playFixtures.orgUnit,
                orgUnitMode: "DESCENDANTS",
                assignedUserMode: "ALL",
                pageSize: 1,
                fields: { trackedEntity: true },
            })
            .getData();

        expect(response.trackedEntities.length).toBeGreaterThanOrEqual(0);
    });

    it("returns a sorted list when ordered by updatedAtClient:desc", async () => {
        const response = await api.tracker.trackedEntities
            .get({
                program: playFixtures.program,
                orgUnits: playFixtures.orgUnit,
                orgUnitMode: "DESCENDANTS",
                order: [{ type: "field", field: "updatedAtClient", direction: "desc" }],
                pageSize: 5,
                fields: { trackedEntity: true, updatedAtClient: true },
            })
            .getData();

        const dates = response.trackedEntities.map(te => te.updatedAtClient);
        const sortedDesc = [...dates].sort((a, b) => b.localeCompare(a));
        expect(dates).toEqual(sortedDesc);
    });

    it("decodes v42 fields (potentialDuplicate, createdBy, updatedBy, orgUnit)", async () => {
        const response = await api.tracker.trackedEntities
            .get({
                program: playFixtures.program,
                orgUnits: playFixtures.orgUnit,
                orgUnitMode: "DESCENDANTS",
                pageSize: 1,
                fields: {
                    trackedEntity: true,
                    potentialDuplicate: true,
                    createdBy: { uid: true, username: true },
                    updatedBy: { uid: true, username: true },
                    orgUnit: true,
                },
            })
            .getData();

        const [te] = response.trackedEntities;
        expectTypeOf(te.trackedEntity).toBeString();
        expectTypeOf(te.potentialDuplicate).toBeBoolean();
        expectTypeOf(te.orgUnit).toBeString();
        expect(te.orgUnit).not.toContain(";");
    });
});
