import { describe, it, expect, beforeAll } from "vitest";
import { getPlayD2Api, playFixtures } from "../../testing";
import { D2Api } from "../../2.42";

describe("TrackerEnrollments.get against play.dhis2.org/42", () => {
    let api: D2Api;

    beforeAll(() => {
        api = getPlayD2Api();
    });

    it("narrows the result set when status=COMPLETED", async () => {
        const baseParams = {
            program: playFixtures.program,
            orgUnits: playFixtures.orgUnit,
            orgUnitMode: "DESCENDANTS" as const,
            pageSize: 5,
            totalPages: true,
            fields: { enrollment: true, status: true } as const,
        };

        const unfiltered = await api.tracker.enrollments.get(baseParams).getData();
        const filtered = await api.tracker.enrollments
            .get({ ...baseParams, status: "COMPLETED" })
            .getData();

        expect(unfiltered.pager.total).toBeGreaterThan(0);
        expect(filtered.pager.total).toBeGreaterThan(0);
        expect(filtered.pager.total).toBeLessThanOrEqual(unfiltered.pager.total || 0);
        expect(filtered.enrollments.every(e => e.status === "COMPLETED")).toBe(true);
    });

    it("honors the legacy programStatus alias server-side", async () => {
        const params = {
            program: playFixtures.program,
            orgUnits: playFixtures.orgUnit,
            orgUnitMode: "DESCENDANTS" as const,
            pageSize: 5,
            totalPages: true,
            fields: { enrollment: true, status: true } as const,
        };

        const withStatus = await api.tracker.enrollments
            .get({ ...params, status: "COMPLETED" })
            .getData();
        const withLegacy = await api.tracker.enrollments
            .get({ ...params, programStatus: "COMPLETED" })
            .getData();

        expect(withLegacy.pager.total).toBe(withStatus.pager.total);
    });

    it("serializes the order param", async () => {
        const response = await api.tracker.enrollments
            .get({
                program: playFixtures.program,
                orgUnits: playFixtures.orgUnit,
                orgUnitMode: "DESCENDANTS",
                order: "enrolledAt:desc",
                pageSize: 5,
                fields: { enrollment: true, enrolledAt: true },
            })
            .getData();

        const dates = response.enrollments.map(e => e.enrolledAt);
        const sortedDesc = [...dates].sort((a, b) => b.localeCompare(a));
        expect(dates).toEqual(sortedDesc);
    });

    it("decodes v42 enrollment fields on COMPLETED records", async () => {
        const response = await api.tracker.enrollments
            .get({
                program: playFixtures.program,
                orgUnits: playFixtures.orgUnit,
                orgUnitMode: "DESCENDANTS",
                status: "COMPLETED",
                pageSize: 1,
                fields: {
                    enrollment: true,
                    status: true,
                    completedAt: true,
                    completedBy: true,
                    createdBy: { uid: true, username: true },
                    updatedBy: { uid: true, username: true },
                    relationships: true,
                },
            })
            .getData();

        const [enrollment] = response.enrollments;
        expect(enrollment.status).toBe("COMPLETED");
        expect(typeof enrollment.completedAt).toBe("string");
        expect(typeof enrollment.completedBy).toBe("string");
    });
});
