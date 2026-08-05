import { describe, expect, it } from "vitest";
import { ACTIVITY_SECTORS, isActivitySectorCode } from "./activity-sector";

describe("activity sector catalog", () => {
    it("exposes the 28 unique stable codes", () => {
        const codes = ACTIVITY_SECTORS.map(({ code }) => code);

        expect(codes).toHaveLength(28);
        expect(new Set(codes).size).toBe(codes.length);
        expect(codes.every((code) => /^[A-Z]{3}$/.test(code))).toBe(true);
    });

    it("keeps the requested labels attached to their stable codes", () => {
        const sectorsByCode = Object.fromEntries(
            ACTIVITY_SECTORS.map(({ code, label }) => [code, label]),
        );

        expect(sectorsByCode.AGR).toBe("Agriculture, sylviculture et pêche");
        expect(sectorsByCode.TIC).toBe("Informatique, numérique et télécommunications");
        expect(sectorsByCode.INT).toBe("Organisations et activités internationales");
    });

    it("recognizes only catalog codes", () => {
        expect(isActivitySectorCode("BTP")).toBe(true);
        expect(isActivitySectorCode("btp")).toBe(false);
        expect(isActivitySectorCode(null)).toBe(false);
    });
});
