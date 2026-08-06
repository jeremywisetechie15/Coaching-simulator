import { describe, expect, it } from "vitest";
import {
    getCategoriesForDomain,
    LEARNER_CONTENT_STATUS_FILTER,
} from "@/features/content/domain";
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
            domain: "Management, stratégie et transformation",
            learnerStatus: LEARNER_CONTENT_STATUS_FILTER.all,
            level: roleplayLevelFilterOptions[0],
            query: "",
        });

        expect(filtered).toHaveLength(1);
        expect(
            filtered.every(
                (roleplay) => roleplay.domain === "Management, stratégie et transformation",
            ),
        ).toBe(true);
        expect(filtered[0]?.name).toBe("Claude SAVARY");
    });

    it("combines domain, category, level and DISC filters", () => {
        const filtered = filterRoleplaysByLibraryFilters(roleplays, {
            category: "Négociation commerciale",
            disc: "Influent",
            domain: "Commerce et développement commercial",
            learnerStatus: LEARNER_CONTENT_STATUS_FILTER.all,
            level: "Facile",
            query: "",
        });

        expect(filtered.map((roleplay) => roleplay.name)).toEqual(["Sophie Martin"]);
    });

    it("filters roleplays by learner status", () => {
        const filtered = filterRoleplaysByLibraryFilters(roleplays, {
            category: roleplayCategoryFilterOptions[0],
            disc: roleplayDiscFilterOptions[0],
            domain: roleplayDomainFilterOptions[0],
            learnerStatus: LEARNER_CONTENT_STATUS_FILTER.retry,
            level: roleplayLevelFilterOptions[0],
            query: "",
        });

        expect(filtered.map((roleplay) => roleplay.name)).toEqual([
            "Claude SAVARY",
            "Marc Dubois",
        ]);
    });

    it("searches across scenario and persona content without accent sensitivity", () => {
        const filtered = filterRoleplaysByLibraryFilters(roleplays, {
            category: roleplayCategoryFilterOptions[0],
            disc: roleplayDiscFilterOptions[0],
            domain: roleplayDomainFilterOptions[0],
            learnerStatus: LEARNER_CONTENT_STATUS_FILTER.all,
            level: roleplayLevelFilterOptions[0],
            query: "negociation",
        });

        expect(filtered.map((roleplay) => roleplay.name)).toEqual(["Sophie Martin"]);
    });

    it("limits category options to the selected domain", () => {
        expect(getRoleplayCategoryFilterOptions(roleplayDomainFilterOptions[0])).toContain("Entretien de Remobilisation");
        expect(getRoleplayCategoryFilterOptions("Commerce et développement commercial")).toEqual([
            roleplayCategoryFilterOptions[0],
            ...getCategoriesForDomain("Commerce et développement commercial"),
        ]);
    });
});
