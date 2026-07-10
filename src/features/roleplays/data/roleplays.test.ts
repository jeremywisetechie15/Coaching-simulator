import { describe, expect, it } from "vitest";
import {
    filterRoleplaysByLibraryFilters,
    getRoleplayCategoryFilterOptions,
    roleplayCategoryFilterOptions,
    roleplayDiscFilterOptions,
    roleplayDomainFilterOptions,
    roleplayLevelFilterOptions,
    roleplays,
} from "./roleplays";

describe("roleplay library filters", () => {
    it("filters roleplays by selected domain", () => {
        const filtered = filterRoleplaysByLibraryFilters(roleplays, {
            category: roleplayCategoryFilterOptions[0],
            disc: roleplayDiscFilterOptions[0],
            domain: "Management",
            level: roleplayLevelFilterOptions[0],
        });

        expect(filtered).toHaveLength(1);
        expect(filtered.every((roleplay) => roleplay.domain === "Management")).toBe(true);
        expect(filtered[0]?.name).toBe("Claude SAVARY");
    });

    it("combines domain, category, level and DISC filters", () => {
        const filtered = filterRoleplaysByLibraryFilters(roleplays, {
            category: "Négociation",
            disc: "Influent",
            domain: "Commercial",
            level: "Facile",
        });

        expect(filtered.map((roleplay) => roleplay.name)).toEqual(["Sophie Martin"]);
    });

    it("limits category options to the selected domain", () => {
        expect(getRoleplayCategoryFilterOptions(roleplayDomainFilterOptions[0])).toContain("Entretien de Remobilisation");
        expect(getRoleplayCategoryFilterOptions("Commercial")).toEqual([
            roleplayCategoryFilterOptions[0],
            "Prospection",
            "Négociation",
            "Vente",
            "Recommandation",
            "Prise de rendez-vous",
        ]);
    });
});
