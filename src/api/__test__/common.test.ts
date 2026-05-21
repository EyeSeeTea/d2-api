import { describe, expect, it } from "vitest";
import { getFieldsAsString, processFieldsFilterParams } from "../common";

describe("getFieldsAsString", () => {
    describe("flat boolean fields", () => {
        it("serializes a single field", () => {
            expect(getFieldsAsString({ id: true })).toBe("id");
        });

        it("sorts multiple fields alphabetically", () => {
            expect(getFieldsAsString({ name: true, id: true })).toBe("id,name");
        });

        it("excludes fields set to false", () => {
            expect(getFieldsAsString({ id: true, name: false, code: true })).toBe("code,id");
        });

        it("returns empty string for empty object", () => {
            expect(getFieldsAsString({})).toBe("");
        });
    });

    describe("nested fields", () => {
        it("serializes one level of nesting with brackets", () => {
            expect(getFieldsAsString({ children: { id: true, name: true } })).toBe(
                "children[id,name]"
            );
        });

        it("serializes multiple levels of nesting", () => {
            expect(getFieldsAsString({ parent: { children: { id: true } } })).toBe(
                "parent[children[id]]"
            );
        });

        it("combines flat and nested fields sorted together", () => {
            expect(getFieldsAsString({ id: true, children: { name: true } })).toBe(
                "children[name],id"
            );
        });
    });

    describe("field transformers", () => {
        it("applies rename transformer with ~rename(to) suffix", () => {
            const result = getFieldsAsString({
                displayName: { $fn: { name: "rename", to: "name" } },
            });
            expect(result).toBe("displayName~rename(name)");
        });

        it("applies rename transformer and preserves nested fields", () => {
            const result = getFieldsAsString({
                displayName: { $fn: { name: "rename", to: "name" }, id: true },
            });
            expect(result).toBe("displayName~rename(name)[id]");
        });

        it("applies size transformer with ~size suffix", () => {
            const result = getFieldsAsString({
                children: { $fn: { name: "size" } },
            });
            expect(result).toBe("children~size");
        });
    });

    describe("$ prefix conversion", () => {
        it("converts $ prefix to : prefix", () => {
            expect(getFieldsAsString({ $owner: true })).toBe(":owner");
        });
    });
});

describe("processFieldsFilterParams", () => {
    describe("value operator filters", () => {
        it("serializes eq filter", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { name: { eq: "test" } },
            });
            expect(result.filter).toEqual(["name:eq:test"]);
        });

        it("serializes like filter", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { name: { like: "test" } },
            });
            expect(result.filter).toEqual(["name:like:test"]);
        });

        it("serializes multiple operators on the same field sorted", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { age: { ge: "18", le: "65" } },
            });
            expect(result.filter).toEqual(["age:ge:18", "age:le:65"]);
        });
    });

    describe("array operator filters", () => {
        it("serializes in operator with bracket-wrapped values", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { status: { in: ["active", "pending"] } },
            });
            expect(result.filter).toEqual(["status:in:[active,pending]"]);
        });

        it("serializes !in operator", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { status: { "!in": ["deleted"] } },
            });
            expect(result.filter).toEqual(["status:!in:[deleted]"]);
        });
    });

    describe("unary operator filters", () => {
        it("serializes null operator without value", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { parent: { null: true } },
            });
            expect(result.filter).toEqual(["parent:null"]);
        });

        it("serializes !null operator", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { parent: { "!null": true } },
            });
            expect(result.filter).toEqual(["parent:!null"]);
        });

        it("serializes empty operator", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { name: { empty: true } },
            });
            expect(result.filter).toEqual(["name:empty"]);
        });
    });

    describe("empty filter value exclusion", () => {
        it("excludes filter with undefined value", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { name: { eq: undefined } },
            });
            expect(result.filter).toEqual([]);
        });

        it("excludes filter with empty string value", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { name: { eq: "" } },
            });
            expect(result.filter).toEqual([]);
        });
    });

    describe("filter arrays", () => {
        it("produces independent filter strings from array of filter objects", () => {
            const result = processFieldsFilterParams({
                fields: {},
                filter: { name: [{ like: "foo" }, { like: "bar" }] },
            });
            expect(result.filter).toEqual(["name:like:bar", "name:like:foo"]);
        });
    });

    describe("combined fields and filters", () => {
        it("returns dictionary with fields and filter keys", () => {
            const result = processFieldsFilterParams({
                fields: { id: true, name: true },
                filter: { name: { like: "test" } },
            });
            expect(result).toEqual({
                fields: "id,name",
                filter: ["name:like:test"],
            });
        });
    });

    describe("model name prefix", () => {
        it("prefixes keys with modelName when provided", () => {
            const result = processFieldsFilterParams(
                { fields: { id: true }, filter: { name: { eq: "x" } } },
                "user"
            );
            expect(result).toEqual({
                "user:fields": "id",
                "user:filter": ["name:eq:x"],
            });
        });

        it("uses plain keys when no model name is provided", () => {
            const result = processFieldsFilterParams({
                fields: { id: true },
                filter: { name: { eq: "x" } },
            });
            expect(result).toEqual({
                fields: "id",
                filter: ["name:eq:x"],
            });
        });
    });
});
