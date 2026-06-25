import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { SaveSkillDto } from "@/features/skills/dto";
import { createSkillDimensionItemRows, slugifySkillValue } from "./skills.persistence";

const skillInput: SaveSkillDto = {
    category: "Métier",
    description: "",
    dimensionItems: {
        savoir: [{ label: "Connaissance de la méthode" }],
        savoir_etre: [{ label: "Posture professionnelle" }],
        savoir_faire: [{ label: "Application en situation" }, { label: "Traitement des objections" }],
    },
    domain: "Commercial",
    functions: ["Sales"],
    id: "",
    name: "Gestion des objections",
    objective: "Prise de rendez-vous prospect qualifié",
    status: CONTENT_STATUS.published,
};

const savoirItemId = "11111111-1111-4111-8111-111111111111";
const savoirFaireItemId = "22222222-2222-4222-8222-222222222222";

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
