import { describe, expect, it } from "vitest";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import { buildMethodJsonPrefillPrompt, parseMethodJsonPrefillText } from "./method-json-prefill";

const options = {
    organizationOptions: [{
        id: "11111111-1111-4111-8111-111111111111",
        name: "Organisation Démo",
    }],
    quizOptions: [{
        id: "22222222-2222-4222-8222-222222222222",
        kind: QUIZ_KIND.contextual,
        methodId: null,
        questionCount: 4,
        title: "Quiz découverte",
    }],
};

const document = {
    schemaVersion: 1,
    entityType: "method",
    data: {
        name: "Méthode de découverte",
        domain: "Commercial",
        category: "Prospection",
        quizId: "22222222-2222-4222-8222-222222222222",
        description: "Structurer un entretien de découverte.",
        readingTimeMinutes: 12,
        visibility: "private",
        organizationId: "11111111-1111-4111-8111-111111111111",
        resources: [{ label: "Guide", externalUrl: "https://example.com/guide" }],
        objectives: ["Qualifier le besoin"],
        challenges: ["Éviter une découverte superficielle"],
        steps: [{
            title: "Explorer le contexte",
            description: "Questionner la situation actuelle.",
            shortName: "Explorer",
            shortDescription: "Comprendre avant de proposer.",
            icon: "search",
            learningResource: { label: "Capsule", externalUrl: "https://example.com/video" },
            objectives: ["Comprendre le contexte"],
            bestPractices: ["Poser des questions ouvertes"],
            pitfalls: ["Présenter trop tôt"],
            posture: ["Écoute active"],
            verbatims: ["Comment procédez-vous aujourd’hui ?"],
        }],
    },
};

describe("method JSON prefill", () => {
    it("maps every visible method field and validates dynamic relations", () => {
        const result = parseMethodJsonPrefillText(JSON.stringify(document), options);

        expect(result.fieldErrors).toEqual({});
        expect(result.draft.quizId).toBe(options.quizOptions[0].id);
        expect(result.draft.organizationId).toBe(options.organizationOptions[0].id);
        expect(result.draft.steps[0]).toMatchObject({ icon: "search", title: "Explorer le contexte" });
    });

    it("keeps the draft editable and flags unknown ids and missing nested fields", () => {
        const result = parseMethodJsonPrefillText(JSON.stringify({
            ...document,
            data: {
                ...document.data,
                quizId: "unknown",
                steps: [{ ...document.data.steps[0], title: undefined }],
            },
        }), options);

        expect(result.draft.quizId).toBeNull();
        expect(result.fieldErrors.quizId).toContain("Aucun quiz");
        expect(result.fieldErrors["steps.0.title"]).toBeDefined();
    });

    it("builds the prompt from the live organization and quiz catalogues", () => {
        const unavailableId = "33333333-3333-4333-8333-333333333333";
        const prompt = buildMethodJsonPrefillPrompt({
            organizationOptions: [
                ...options.organizationOptions,
                { id: unavailableId, isSelectable: false, name: "Organisation non publiée" },
            ],
            quizOptions: [
                ...options.quizOptions,
                {
                    id: unavailableId,
                    isSelectable: false,
                    kind: QUIZ_KIND.contextual,
                    methodId: null,
                    questionCount: 2,
                    title: "Quiz non publié",
                },
            ],
        });

        expect(prompt).toContain(options.organizationOptions[0].id);
        expect(prompt).toContain(options.quizOptions[0].id);
        expect(prompt).toContain('"search"');
        expect(prompt).toContain("uniquement un JSON valide");
        expect(prompt).toContain("fichier portant l’extension .json");
        expect(prompt).toContain("S’il est absent, utilise null au lieu de l’inventer");
        expect(prompt).toContain('"learningResource": {\n          "label"');
        expect(prompt).toContain("actuellement disponibles et sélectionnables");
        expect(prompt).not.toContain(unavailableId);

        const structure = prompt.split("Respecte exactement cette structure :\n\n")[1];
        expect(parseMethodJsonPrefillText(structure, options).fieldErrors).toEqual({});
    });
});
