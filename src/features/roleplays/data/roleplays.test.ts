import { describe, expect, it } from "vitest";
import { LEARNER_CONTENT_STATUS_FILTER } from "@/features/content/domain";
import {
    filterRoleplaysByLibraryFilters,
    getRoleplayCategoryOptions,
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
            learnerStatus: LEARNER_CONTENT_STATUS_FILTER.all,
            level: roleplayLevelFilterOptions[0],
            query: "",
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
        expect(getRoleplayCategoryFilterOptions("Commercial")).toEqual([
            roleplayCategoryFilterOptions[0],
            "Prospection",
            "Négociation",
            "Vente",
            "Recommandation",
            "Prise de rendez-vous",
        ]);
    });

    it("limits roleplay editor categories to the selected domain", () => {
        expect(getRoleplayCategoryOptions(null)).toEqual([]);
        expect(getRoleplayCategoryOptions("Management")).toEqual([
            "Entretien de Remobilisation",
            "Feedback",
            "Pilotage",
        ]);
    });
});
