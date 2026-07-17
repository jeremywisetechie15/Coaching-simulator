import { describe, expect, it } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { SaveSkillDto } from "@/features/skills/dto";
import {
    createSkillDimensionItemRows,
    createSkillInsert,
    createSkillUpdate,
    slugifySkillValue,
} from "./skills.persistence";

const skillInput: SaveSkillDto = {
    category: "Prospection",
    description: "",
    dimensionItems: {
        savoir: [{ label: "Connaissance de la méthode" }],
        savoir_etre: [{ label: "Posture professionnelle" }],
        savoir_faire: [{ label: "Application en situation" }, { label: "Traitement des objections" }],
    },
    assignedUserId: null,
    domain: "Commercial",
    groupId: null,
    id: "",
    name: "Gestion des objections",
    organizationId: null,
    scope: CONTENT_VISIBILITY_SCOPE.public,
    status: CONTENT_STATUS.published,
    type: "Métier",
};

const savoirItemId = "11111111-1111-4111-8111-111111111111";
const savoirFaireItemId = "22222222-2222-4222-8222-222222222222";
const organizationId = "44444444-4444-4444-8444-444444444444";
const groupId = "55555555-5555-4555-8555-555555555555";

describe("skills.persistence", () => {
    it("creates stable slug ids from skill names", () => {
        expect(slugifySkillValue("Gestion des objections")).toBe("gestion-des-objections");
        expect(slugifySkillValue("  Écoute active & reformulation  ")).toBe("ecoute-active-reformulation");
    });

    it("creates ordered dimension item rows", () => {
        const rows = createSkillDimensionItemRows("gestion-objections", skillInput);

        expect(rows).toEqual([
            {
                dimension: "savoir",
                is_active: true,
                item_order: 1,
                label: "Connaissance de la méthode",
                skill_id: "gestion-objections",
            },
            {
                dimension: "savoir_faire",
                is_active: true,
                item_order: 1,
                label: "Application en situation",
                skill_id: "gestion-objections",
            },
            {
                dimension: "savoir_faire",
                is_active: true,
                item_order: 2,
                label: "Traitement des objections",
                skill_id: "gestion-objections",
            },
            {
                dimension: "savoir_etre",
                is_active: true,
                item_order: 1,
                label: "Posture professionnelle",
                skill_id: "gestion-objections",
            },
        ]);
    });

    it("persists private group targeting without objective", () => {
        const row = createSkillInsert(
            {
                ...skillInput,
                groupId,
                organizationId,
                scope: CONTENT_VISIBILITY_SCOPE.group,
            },
            "gestion-objections",
            "66666666-6666-4666-8666-666666666666",
        );

        expect(row).toMatchObject({
            assigned_user_id: null,
            group_id: groupId,
            organization_id: organizationId,
            visibility_scope: CONTENT_VISIBILITY_SCOPE.group,
        });
        expect(row).not.toHaveProperty("objective");
    });

    it("maps type, domain and category on create and update without functions", () => {
        const insert = createSkillInsert(
            skillInput,
            "gestion-objections",
            "66666666-6666-4666-8666-666666666666",
        );
        const update = createSkillUpdate(skillInput);

        expect(insert).toMatchObject({
            category: "Prospection",
            domain: "Commercial",
            skill_type: "Métier",
        });
        expect(update).toMatchObject({
            category: "Prospection",
            domain: "Commercial",
            skill_type: "Métier",
        });
        expect(insert).not.toHaveProperty("functions");
        expect(update).not.toHaveProperty("functions");
    });

    it("maps an empty taxonomy pair to null on create and update", () => {
        const emptyTaxonomyInput = {
            ...skillInput,
            category: "",
            domain: "",
        } satisfies SaveSkillDto;

        expect(
            createSkillInsert(
                emptyTaxonomyInput,
                "gestion-objections",
                "66666666-6666-4666-8666-666666666666",
            ),
        ).toMatchObject({ category: null, domain: null });
        expect(createSkillUpdate(emptyTaxonomyInput)).toMatchObject({ category: null, domain: null });
    });

    it("keeps existing dimension item ids when editing a skill", () => {
        const rows = createSkillDimensionItemRows("gestion-objections", {
            ...skillInput,
            dimensionItems: {
                savoir: [{ id: savoirItemId, label: "Connaissance de la méthode" }],
                savoir_etre: [{ label: "Posture professionnelle" }],
                savoir_faire: [
                    { id: savoirFaireItemId, label: "Application en situation" },
                    { label: "Traitement des objections" },
                ],
            },
        });

        expect(rows).toEqual([
            {
                dimension: "savoir",
                id: savoirItemId,
                is_active: true,
                item_order: 1,
                label: "Connaissance de la méthode",
                skill_id: "gestion-objections",
            },
            {
                dimension: "savoir_faire",
                id: savoirFaireItemId,
                is_active: true,
                item_order: 1,
                label: "Application en situation",
                skill_id: "gestion-objections",
            },
            {
                dimension: "savoir_faire",
                is_active: true,
                item_order: 2,
                label: "Traitement des objections",
                skill_id: "gestion-objections",
            },
            {
                dimension: "savoir_etre",
                is_active: true,
                item_order: 1,
                label: "Posture professionnelle",
                skill_id: "gestion-objections",
            },
        ]);
    });
});
