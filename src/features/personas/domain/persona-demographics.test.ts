import { describe, expect, it } from "vitest";
import {
    getPersonaPcsGroupCode,
    getPersonaPcsGroupLabel,
    getPersonaSexCode,
    getPersonaSexLabel,
    isPersonaPcsGroupCode,
    isPersonaSexCode,
    PERSONA_PCS_GROUPS,
    PERSONA_SEXES,
} from "./persona-demographics";

describe("persona demographics SSOT", () => {
    it("exposes the two source sex values with stable codes", () => {
        expect(PERSONA_SEXES).toEqual([
            { code: "female", label: "Femme" },
            { code: "male", label: "Homme" },
        ]);
        expect(getPersonaSexCode("Homme")).toBe("male");
        expect(getPersonaSexLabel("female")).toBe("Femme");
        expect(isPersonaSexCode("unknown")).toBe(false);
    });

    it("exposes the eight aggregated PCS 2003 groups", () => {
        expect(PERSONA_PCS_GROUPS).toHaveLength(8);
        expect(getPersonaPcsGroupCode("Retraités")).toBe("7");
        expect(getPersonaPcsGroupLabel("8")).toBe("Autres personnes sans activité professionnelle");
        expect(isPersonaPcsGroupCode("9")).toBe(false);
    });
});
