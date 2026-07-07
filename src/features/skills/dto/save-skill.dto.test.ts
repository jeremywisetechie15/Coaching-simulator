import { describe, expect, it } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { saveSkillDto } from "./save-skill.dto";

const completeSkillInput = {
    category: "Métier",
    description: "Traiter les objections sans casser la relation.",
    dimensionItems: {
        savoir: [{ label: "Connaître les objections fréquentes" }],
        savoir_etre: [{ label: "Rester calme face au refus" }],
        savoir_faire: [{ label: "Reformuler l'objection" }],
    },
    domain: "Commercial",
    functions: ["Sales", "", "Sales"],
    name: "Gestion des objections",
};

const organizationId = "44444444-4444-4444-8444-444444444444";
const groupId = "55555555-5555-4555-8555-555555555555";
const userId = "66666666-6666-4666-8666-666666666666";

const savoirItemId = "11111111-1111-4111-8111-111111111111";
const savoirFaireItemId = "22222222-2222-4222-8222-222222222222";
const savoirEtreItemId = "33333333-3333-4333-8333-333333333333";

describe("saveSkillDto", () => {
    it("normalizes a valid draft skill", () => {
        const result = saveSkillDto.parse({
            ...completeSkillInput,
            dimensionItems: {
                savoir: [{ label: "  Connaître les objections fréquentes  " }, { label: "" }],
                savoir_etre: [{ label: "Rester calme face au refus" }],
                savoir_faire: [{ label: "Reformuler l'objection" }],
            },
        });

        expect(result.functions).toEqual(["Sales"]);
        expect(result.status).toBe(CONTENT_STATUS.draft);
        expect(result.scope).toBe(CONTENT_VISIBILITY_SCOPE.public);
        expect(result.dimensionItems.savoir).toEqual([
            { label: "Connaître les objections fréquentes" },
        ]);
    });

    it("accepts a complete published skill", () => {
        const result = saveSkillDto.parse({
            ...completeSkillInput,
            status: CONTENT_STATUS.published,
        });

        expect(result.status).toBe(CONTENT_STATUS.published);
    });

    it("preserves dimension item ids when parsing an edited skill", () => {
        const result = saveSkillDto.parse({
            ...completeSkillInput,
            dimensionItems: {
                savoir: [{ id: savoirItemId, label: "  Connaître les objections fréquentes  " }],
                savoir_etre: [{ id: savoirEtreItemId, label: "Rester calme face au refus" }],
                savoir_faire: [
                    { id: savoirFaireItemId, label: "Reformuler l'objection" },
                    { label: "Traiter l'objection" },
                ],
            },
            status: CONTENT_STATUS.published,
        });

        expect(result.dimensionItems).toMatchObject({
            savoir: [{ id: savoirItemId, label: "Connaître les objections fréquentes" }],
            savoir_etre: [{ id: savoirEtreItemId, label: "Rester calme face au refus" }],
            savoir_faire: [
                { id: savoirFaireItemId, label: "Reformuler l'objection" },
                { label: "Traiter l'objection" },
            ],
        });
    });

    it("requires every dimension before publishing", () => {
        const result = saveSkillDto.safeParse({
            ...completeSkillInput,
            dimensionItems: {
                savoir: [{ label: "Connaître les objections fréquentes" }],
                savoir_etre: [],
                savoir_faire: [{ label: "Reformuler l'objection" }],
            },
            status: CONTENT_STATUS.published,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: "Chaque dimension doit contenir au moins un item pour publier une compétence.",
                        path: ["dimensionItems", "savoir_etre"],
                    }),
                ]),
            );
        }
    });

    it("accepts private group targeting", () => {
        const result = saveSkillDto.parse({
            ...completeSkillInput,
            groupId,
            organizationId,
            scope: CONTENT_VISIBILITY_SCOPE.group,
        });

        expect(result.groupId).toBe(groupId);
        expect(result.organizationId).toBe(organizationId);
        expect(result.scope).toBe(CONTENT_VISIBILITY_SCOPE.group);
    });

    it("requires a target for private user scope", () => {
        const result = saveSkillDto.safeParse({
            ...completeSkillInput,
            scope: CONTENT_VISIBILITY_SCOPE.user,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: "L'utilisateur est requis pour une compétence privée utilisateur.",
                        path: ["assignedUserId"],
                    }),
                ]),
            );
        }
    });

    it("accepts private user targeting", () => {
        const result = saveSkillDto.parse({
            ...completeSkillInput,
            assignedUserId: userId,
            scope: CONTENT_VISIBILITY_SCOPE.user,
        });

        expect(result.assignedUserId).toBe(userId);
        expect(result.scope).toBe(CONTENT_VISIBILITY_SCOPE.user);
    });

    it("rejects invalid explicit skill ids", () => {
        const result = saveSkillDto.safeParse({
            ...completeSkillInput,
            id: "Gestion Objections",
        });

        expect(result.success).toBe(false);
    });
});
