import { describe, expect, it } from "vitest";
import {
    hasSkillUsageLockedConfigurationChanged,
    type SkillUsageLockedConfiguration,
} from "./skill-usage-edit-policy";

function lockedConfiguration(): SkillUsageLockedConfiguration {
    return {
        assignedUserId: null,
        category: "Prospection",
        dimensionItems: [
            {
                dimension: "savoir",
                id: "11111111-1111-4111-8111-111111111111",
                label: "Identifier le décideur",
                order: 1,
            },
        ],
        domain: "Commerce et développement commercial",
        groupId: null,
        organizationId: null,
        scope: "public",
        type: "Métier",
    };
}

describe("skill usage edit policy", () => {
    it("keeps an unchanged locked configuration editable", () => {
        const current = lockedConfiguration();

        expect(
            hasSkillUsageLockedConfigurationChanged(
                current,
                structuredClone(current),
            ),
        ).toBe(false);
    });

    it.each([
        ["taxonomy", (next: SkillUsageLockedConfiguration) => {
            next.category = "Vente";
        }],
        ["target", (next: SkillUsageLockedConfiguration) => {
            next.scope = "organization";
            next.organizationId = "22222222-2222-4222-8222-222222222222";
        }],
        ["dimension label", (next: SkillUsageLockedConfiguration) => {
            next.dimensionItems[0]!.label = "Nouveau libellé";
        }],
        ["dimension order", (next: SkillUsageLockedConfiguration) => {
            next.dimensionItems[0]!.order = 2;
        }],
        ["dimension association", (next: SkillUsageLockedConfiguration) => {
            next.dimensionItems[0]!.dimension = "savoir_faire";
        }],
    ])("detects a changed %s", (_label, mutate) => {
        const current = lockedConfiguration();
        const next = structuredClone(current);
        mutate(next);

        expect(
            hasSkillUsageLockedConfigurationChanged(current, next),
        ).toBe(true);
    });
});
