import { describe, expect, it } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { mapSkillRowToListItem, mapSkillRowsToDetail } from "./skill.mapper";

describe("skill.mapper", () => {
    it("maps the database type and shared taxonomy without legacy functions", () => {
        const skill = mapSkillRowToListItem({
            category: "Gestion des conflits",
            description: "Gérer un désaccord de façon constructive.",
            domain: "Communication",
            id: "gestion-conflits",
            is_active: true,
            name: "Gestion des conflits",
            skill_type: "Comportementale",
            status: CONTENT_STATUS.published,
            visibility_scope: CONTENT_VISIBILITY_SCOPE.public,
        });

        expect(skill).toMatchObject({
            category: "Gestion des conflits",
            domain: "Communication",
            type: "Comportementale",
        });
        expect(skill).not.toHaveProperty("functions");
    });

    it("normalizes legacy or inconsistent taxonomy values to null", () => {
        expect(
            mapSkillRowToListItem({
                category: "Prospection",
                domain: "Méthode ACDC",
                id: "legacy-skill",
                name: "Compétence historique",
                skill_type: "Inconnu",
            }),
        ).toMatchObject({
            category: null,
            domain: null,
            type: "Métier",
        });

        expect(
            mapSkillRowToListItem({
                category: "Feedback",
                domain: "Commercial",
                id: "mismatched-skill",
                name: "Compétence mal classée",
                skill_type: "Transversale",
            }),
        ).toMatchObject({
            category: null,
            domain: "Commercial",
            type: "Transversale",
        });
    });

    it("keeps dimension mapping independent from taxonomy mapping", () => {
        const skill = mapSkillRowsToDetail(
            {
                category: null,
                domain: null,
                id: "competence-sans-classement",
                name: "Compétence sans classement",
                skill_type: "Métier",
            },
            [
                {
                    dimension: "savoir_faire",
                    id: "11111111-1111-4111-8111-111111111111",
                    is_active: true,
                    item_order: 1,
                    label: "Appliquer la méthode",
                    skill_id: "competence-sans-classement",
                },
            ],
        );

        expect(skill.dimensionItems).toEqual([
            expect.objectContaining({
                dimension: "savoir_faire",
                label: "Appliquer la méthode",
            }),
        ]);
    });
});
