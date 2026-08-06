import { describe, expect, it } from "vitest";
import { buildQuizJsonPrefillPrompt, parseQuizJsonPrefillText } from "./quiz-json-prefill";

const methodId = "11111111-1111-4111-8111-111111111111";
const methodStepId = "22222222-2222-4222-8222-222222222222";
const dimensionItemId = "33333333-3333-4333-8333-333333333333";
const options = {
    groupOptions: [],
    methodOptions: [{
        id: methodId,
        name: "Méthode Démo",
        steps: [{ id: methodStepId, order: 1, title: "Découvrir", weight: 100 }],
    }],
    organizationOptions: [],
    skillOptions: [{
        dimensionItems: [{
            dimension: "savoir" as const,
            id: dimensionItemId,
            isActive: true,
            label: "Connaître les questions ouvertes",
            order: 1,
            skillId: "decouverte",
        }],
        domain: "Commerce et développement commercial" as const,
        id: "decouverte",
        name: "Découverte",
    }],
    userOptions: [],
};

const document = {
    schemaVersion: 1,
    entityType: "quiz",
    data: {
        title: "Quiz découverte",
        description: "Valider les fondamentaux de la découverte.",
        quizType: "knowledge",
        difficulty: "Moyen",
        domain: "Commerce et développement commercial",
        categories: ["Prospection"],
        durationMinutes: 15,
        maxAttempts: 3,
        validationThreshold: 70,
        participation: "optional",
        methodId,
        scope: "public",
        organizationId: null,
        groupId: null,
        assignedUserId: null,
        tags: ["découverte"],
        steps: [{
            methodStepId,
            name: "Découvrir",
            weight: 100,
            competenceIds: ["decouverte"],
            questions: [{
                prompt: "Quel type de question favorise la découverte ?",
                type: "QCU",
                points: 1,
                competenceId: "decouverte",
                dimensionItemId,
                explanation: "Une question ouverte favorise l’exploration.",
                choices: [
                    { label: "Une question ouverte", isCorrect: true },
                    { label: "Une question fermée", isCorrect: false },
                ],
                attachments: [],
            }],
        }],
    },
};

describe("quiz JSON prefill", () => {
    it("maps a complete quiz and validates every nested relation", () => {
        const result = parseQuizJsonPrefillText(JSON.stringify(document), options);

        expect(result.fieldErrors).toEqual({});
        expect(result.draft.methodId).toBe(methodId);
        expect(result.draft.steps[0].questions[0].dimensionItemId).toBe(dimensionItemId);
    });

    it("flags unknown skills and inconsistent QCU answers", () => {
        const result = parseQuizJsonPrefillText(JSON.stringify({
            ...document,
            data: {
                ...document.data,
                steps: [{
                    ...document.data.steps[0],
                    competenceIds: ["unknown"],
                    questions: [{
                        ...document.data.steps[0].questions[0],
                        competenceId: "unknown",
                        choices: [
                            { label: "A", isCorrect: true },
                            { label: "B", isCorrect: true },
                        ],
                    }],
                }],
            },
        }), options);

        expect(result.fieldErrors["steps.0.competenceIds.0"]).toContain("Aucune compétence");
        expect(result.fieldErrors["steps.0.questions.0.choices"]).toContain("exactement une");
    });

    it("includes methods, steps, skills and dimension items in the prompt", () => {
        const unavailableId = "44444444-4444-4444-8444-444444444444";
        const prompt = buildQuizJsonPrefillPrompt({
            ...options,
            methodOptions: [
                ...options.methodOptions,
                { id: unavailableId, isSelectable: false, name: "Méthode non publiée", steps: [] },
            ],
        });

        expect(prompt).toContain(methodId);
        expect(prompt).toContain(methodStepId);
        expect(prompt).toContain(dimensionItemId);
        expect(prompt).toContain("uniquement un JSON valide");
        expect(prompt).toContain("fichier portant l’extension .json");
        expect(prompt).toContain("attribue 1 point à chaque question");
        expect(prompt).toContain("Le score de chaque étape est le prorata des points obtenus");
        expect(prompt).toContain("attribue le reliquat d’un point aux premières étapes");
        expect(prompt).toContain('Visibilités : ["public","organization","group","user"]');
        expect(prompt).toContain('Types de pièces jointes : ["link","image","video","audio","document"]');
        expect(prompt).not.toContain(unavailableId);

        const structure = prompt.split("Respecte exactement cette structure :\n\n")[1];
        expect((JSON.parse(structure) as { data: { maxAttempts: number | null } }).data.maxAttempts).toBeNull();
        expect(parseQuizJsonPrefillText(structure, options).fieldErrors).toEqual({});
    });

    it("distributes missing method weights as integer percentages totaling 100", () => {
        const prompt = buildQuizJsonPrefillPrompt({
            ...options,
            methodOptions: [{
                id: methodId,
                name: "Méthode Démo",
                steps: [
                    { id: "step-1", order: 1, title: "Étape 1", weight: null },
                    { id: "step-2", order: 2, title: "Étape 2", weight: null },
                    { id: "step-3", order: 3, title: "Étape 3", weight: null },
                ],
            }],
        });
        const structure = prompt.split("Respecte exactement cette structure :\n\n")[1];
        const example = JSON.parse(structure) as { data: { steps: Array<{ weight: number }> } };

        expect(example.data.steps.map((step) => step.weight)).toEqual([34, 33, 33]);
    });
});
