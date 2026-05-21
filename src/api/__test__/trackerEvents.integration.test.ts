import { describe, it, expect, expectTypeOf } from "vitest";
import { getPlayD2Api, playFixtures } from "../../testing";

const EVENT_ID = "RcBUozdEU8o";

describe("TrackerEvents.get against play.dhis2.org/42", () => {
    const api = getPlayD2Api();

    it("rejects an unknown attributeCategoryCombo (regression: attributeCc was silently ignored)", async () => {
        // With the old `attributeCc` name, DHIS2 v42 ignored the param and returned 200.
        // After the rename to `attributeCategoryCombo`, an unknown CC must surface a server error.
        await expect(
            api.tracker.events
                .get({
                    program: playFixtures.program,
                    orgUnit: playFixtures.orgUnit,
                    orgUnitMode: "DESCENDANTS",
                    attributeCategoryCombo: "invalid_attribute_cc_id",
                    attributeCategoryOptions: "invalid_attribute_co_id",
                    pageSize: 1,
                    fields: { event: true },
                })
                .getData()
        ).rejects.toThrow();
    });

    it("decodes followUp as a camelCase field (regression: typo was `followup`)", async () => {
        const response = await api.tracker.events
            .get({
                program: playFixtures.program,
                orgUnit: playFixtures.orgUnit,
                orgUnitMode: "DESCENDANTS",
                pageSize: 1,
                fields: { event: true, followUp: true },
            })
            .getData();

        const [event] = response.events;
        // I didn't want to test against the value
        // because it could be changed by users and break the test
        expectTypeOf(event.followUp).toBeBoolean();
    });

    it("narrows the result set when enrollmentStatus=COMPLETED", async () => {
        const baseParams = {
            program: playFixtures.program,
            orgUnit: playFixtures.orgUnit,
            orgUnitMode: "DESCENDANTS" as const,
            pageSize: 5,
            totalPages: true,
            fields: { event: true } as const,
        };

        const unfiltered = await api.tracker.events.get(baseParams).getData();
        const filtered = await api.tracker.events
            .get({ ...baseParams, enrollmentStatus: "COMPLETED" })
            .getData();

        expect(unfiltered.pager.total).toBeGreaterThan(0);
        expect(filtered.pager.total).toBeGreaterThan(0);
        expect(filtered.pager.total).toBeLessThanOrEqual(unfiltered.pager.total || 0);
    });

    it("accepts categoryOptionIdScheme=UID without error", async () => {
        const response = await api.tracker.events
            .get({
                program: playFixtures.program,
                orgUnit: playFixtures.orgUnit,
                orgUnitMode: "DESCENDANTS",
                categoryOptionIdScheme: "UID",
                pageSize: 1,
                fields: { event: true },
            })
            .getData();

        expect(response.events.length).toBe(1);
    });
});

describe("TrackerEvents.getById against play.dhis2.org/42", () => {
    const api = getPlayD2Api();

    it("returns exactly the requested fields (SelectedPick narrowing)", async () => {
        const event = await api.tracker.events
            .getById(EVENT_ID, { fields: { event: true, status: true } })
            .getData();

        expect(Object.keys(event).sort()).toEqual(["event", "status"]);
        expect(event.event).toBe(EVENT_ID);
        expectTypeOf(event.status).toBeString();
    });

    it("decodes followUp when selected (no longer a typo)", async () => {
        const event = await api.tracker.events
            .getById(EVENT_ID, { fields: { event: true, followUp: true } })
            .getData();

        expect(event.event).toBe(EVENT_ID);
        expectTypeOf(event.followUp).toBeBoolean();
    });
});
