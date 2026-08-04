import { describe, expect, it } from "vitest";
import {
    buildSkillJsonPrefillPrompt,
    parseSkillJsonPrefillText,
    SKILL_JSON_PREFILL_FIELD,
} from "./skill-json-prefill";

const organizationId = "11111111-1111-4111-8111-111111111111";
const groupId = "22222222-2222-4222-8222-222222222222";
const userId = "33333333-3333-4333-8333-333333333333";
const unavailableOrganizationId = "44444444-4444-4444-8444-444444444444";
const options = {
    groupOptions: [{ id: groupId, name: "Équipe commerciale", organizationId }],
    organizationOptions: [
        { id: organizationId, name: "Organisation Démo" },
        { id: unavailableOrganizationId, isSelectable: false, name: "Organisation brouillon" },
    ],
    userOptions: [{
        groupIds: [groupId],
        id: userId,
        name: "Alex Martin",
        organizationIds: [organizationId],
    }],
};

const validSkillJson = {
    schemaVersion: 1,
    entityType: "skill",
    data: {
        name: "Conduire un entretien de découverte",
        description: "Identifier le contexte, les besoins et les enjeux du prospect.",
        type: "Métier",
        domain: "Commercial",
        category: "Prospection",
        scope: "public",
        organizationId: null,
        groupId: null,
        assignedUserId: null,
        dimensionItems: {
            savoir: ["Connaître les étapes de découverte"],
            savoir_faire: ["Questionner et reformuler"],
            savoir_etre: ["Faire preuve d'écoute"],
        },
    },
};

describe("skill JSON prefill", () => {
    it("maps a complete JSON document to the skill form", () => {
        const result = parseSkillJsonPrefillText(JSON.stringify(validSkillJson), options);

        expect(result.fieldErrors).toEqual({});
        expect(result.draft).toEqual({
            assignedUserId: "",
            category: "Prospection",
            description: "Identifier le contexte, les besoins et les enjeux du prospect.",
            dimensionItems: {
                savoir: ["Connaître les étapes de découverte"],
                savoir_etre: ["Faire preuve d'écoute"],
                savoir_faire: ["Questionner et reformuler"],
            },
            domain: "Commercial",
            groupId: "",
            name: "Conduire un entretien de découverte",
            organizationId: null,
            scope: "public",
            type: "Métier",
        });
    });

    it("rejects invalid JSON and incompatible metadata before touching the form", () => {
        expect(() => parseSkillJsonPrefillText("{invalid", options)).toThrow(
            "Le fichier ne contient pas un JSON valide.",
        );
        expect(() =>
            parseSkillJsonPrefillText(
                JSON.stringify({ ...validSkillJson, schemaVersion: 2 }),
                options,
            ),
        ).toThrow("La version du fichier doit être 1.");
        expect(() =>
            parseSkillJsonPrefillText(
                JSON.stringify({ ...validSkillJson, entityType: "quiz" }),
                options,
            ),
        ).toThrow("Ce fichier JSON ne correspond pas à une compétence.");
    });

    it("keeps valid values and reports missing or invalid fields precisely", () => {
        const result = parseSkillJsonPrefillText(
            JSON.stringify({
                ...validSkillJson,
                data: {
                    ...validSkillJson.data,
                    category: "Pilotage",
                    description: "",
                    scope: "organization",
                    type: "Inconnue",
                    dimensionItems: {
                        savoir: [],
                        savoir_faire: ["Questionner", ""],
                    },
                },
            }),
            options,
        );

        expect(result.draft.name).toBe("Conduire un entretien de découverte");
        expect(result.draft.description).toBe("");
        expect(result.draft.type).toBeNull();
        expect(result.draft.category).toBeNull();
        expect(result.draft.dimensionItems.savoir).toEqual([""]);
        expect(result.draft.dimensionItems.savoir_faire).toEqual(["Questionner", ""]);
        expect(result.draft.dimensionItems.savoir_etre).toEqual([""]);
        expect(result.fieldErrors[SKILL_JSON_PREFILL_FIELD.description]).toBeDefined();
        expect(result.fieldErrors[SKILL_JSON_PREFILL_FIELD.type]).toContain("Métier");
        expect(result.fieldErrors[SKILL_JSON_PREFILL_FIELD.category]).toContain("Commercial");
        expect(result.fieldErrors[SKILL_JSON_PREFILL_FIELD.organizationId]).toBeDefined();
        expect(result.fieldErrors[SKILL_JSON_PREFILL_FIELD.knowledge]).toBeDefined();
        expect(result.fieldErrors["dimensionItems.savoir_faire.1"]).toBeDefined();
        expect(result.fieldErrors[SKILL_JSON_PREFILL_FIELD.attitude]).toBeDefined();
    });

    it("builds a prompt from the same enums used by the form", () => {
        const prompt = buildSkillJsonPrefillPrompt(options);

        expect(prompt).toContain('"Métier"');
        expect(prompt).toContain('"Comportementale"');
        expect(prompt).toContain('"Commercial"');
        expect(prompt).toContain('"Prospection"');
        expect(prompt).toContain('"scope": "public"');
        expect(prompt).toContain('"organizationId": null');
        expect(prompt).toContain(organizationId);
        expect(prompt).toContain(groupId);
        expect(prompt).toContain(userId);
        expect(prompt).not.toContain(unavailableOrganizationId);
        expect(prompt).toContain('"entityType": "skill"');
        expect(prompt).toContain("aucune balise Markdown");
        expect(prompt).toContain("fichier portant l’extension .json");
        expect(prompt).toContain("savoir_faire pour les actions et techniques observables");

        const structure = prompt.split("Respecte exactement cette structure :\n\n")[1];
        expect(parseSkillJsonPrefillText(structure, options).fieldErrors).toEqual({});
    });

    it("validates a private user target against the live organization and group relations", () => {
        const result = parseSkillJsonPrefillText(JSON.stringify({
            ...validSkillJson,
            data: {
                ...validSkillJson.data,
                assignedUserId: userId,
                groupId,
                organizationId,
                scope: "user",
            },
        }), options);

        expect(result.fieldErrors).toEqual({});
        expect(result.draft).toMatchObject({ assignedUserId: userId, groupId, organizationId, scope: "user" });
    });
});
