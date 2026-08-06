import { describe, expect, it } from "vitest";
import { buildScorecardJsonPrefillPrompt, parseScorecardJsonPrefillText } from "./scorecard-json-prefill";

const methodId = "11111111-1111-4111-8111-111111111111";
const methodStepId = "22222222-2222-4222-8222-222222222222";
const dimensionItemId = "33333333-3333-4333-8333-333333333333";
const organizationId = "44444444-4444-4444-8444-444444444444";
const options = {
    methodOptions: [{
        id: methodId,
        name: "Méthode Démo",
        steps: [{ id: methodStepId, order: 1, title: "Découvrir", weight: 100 }],
    }],
    organizationOptions: [{ id: organizationId, name: "Organisation Démo" }],
    skillOptions: [{
        dimensionItems: [{
            dimension: "savoir_faire" as const,
            id: dimensionItemId,
            isActive: true,
            label: "Questionner et reformuler",
            order: 1,
            skillId: "decouverte",
        }],
        domain: "Commerce et développement commercial" as const,
        id: "decouverte",
        name: "Découverte",
    }],
};

const document = {
    schemaVersion: 1,
    entityType: "scorecard",
    data: {
        name: "Scorecard découverte",
        methodId,
        domain: "Commerce et développement commercial",
        category: "Prospection",
        level: "Moyen",
        description: "Évaluer un entretien de découverte.",
        visibility: "public",
        organizationId: null,
        steps: [{
            methodStepId,
            weightPercent: 100,
            criteria: [{
                key: "Questions ouvertes",
                expectedEvidence: "Le vendeur explore le contexte.",
                competenceId: "decouverte",
                dimension: "savoir_faire",
                dimensionItemId,
                maxPoints: 4,
                aiInstruction: "Identifier les questions ouvertes.",
                verbatim: "Comment faites-vous aujourd’hui ?",
            }],
        }],
    },
};

describe("scorecard JSON prefill", () => {
    it("validates method, step, skill and dimension-item ownership", () => {
        const result = parseScorecardJsonPrefillText(JSON.stringify(document), options);

        expect(result.fieldErrors).toEqual({});
        expect(result.draft.steps[0].methodStepId).toBe(methodStepId);
        expect(result.draft.steps[0].criteria[0].dimensionItemId).toBe(dimensionItemId);
    });

    it("rejects an item id that does not belong to the selected skill dimension", () => {
        const result = parseScorecardJsonPrefillText(JSON.stringify({
            ...document,
            data: {
                ...document.data,
                steps: [{
                    ...document.data.steps[0],
                    criteria: [{ ...document.data.steps[0].criteria[0], dimensionItemId: "44444444-4444-4444-8444-444444444444" }],
                }],
            },
        }), options);

        expect(result.draft.steps[0].criteria[0].dimensionItemId).toBeNull();
        expect(result.fieldErrors["steps.0.criteria.0.dimensionItemId"]).toContain("Aucun item actif");
    });

    it("copies the exact live ids into the AI prompt", () => {
        const unavailableId = "55555555-5555-4555-8555-555555555555";
        const prompt = buildScorecardJsonPrefillPrompt({
            ...options,
            methodOptions: [
                ...options.methodOptions,
                { id: unavailableId, isSelectable: false, name: "Méthode non publiée", steps: [] },
            ],
        });

        expect(prompt).toContain(methodId);
        expect(prompt).toContain(methodStepId);
        expect(prompt).toContain(dimensionItemId);
        expect(prompt).toContain(organizationId);
        expect(prompt).toContain("dimensionItemId doit appartenir");
        expect(prompt).toContain('Dimensions autorisées : ["savoir_faire","savoir_etre"]');
        expect(prompt).toContain('Domaines autorisés : ["Management, stratégie et transformation"');
        expect(prompt).toContain('Niveaux autorisés : ["Débutant","Moyen","Avancé","Expert"]');
        expect(prompt).toContain('Visibilités autorisées : ["public","private"]');
        expect(prompt).toContain('applique la règle client visibility="public" avec organizationId=null');
        expect(prompt).not.toContain(unavailableId);

        const structure = prompt.split("Respecte exactement cette structure :\n\n")[1];
        expect(parseScorecardJsonPrefillText(structure, options).fieldErrors).toEqual({});
    });

    it("combines the client document-analysis rules with the strict JSON contract", () => {
        const prompt = buildScorecardJsonPrefillPrompt(options);

        expect(prompt).toContain("Lis toutes les pages, tous les tableaux, critères, barèmes et annexes");
        expect(prompt).toContain("N’omets aucun critère présent dans la source");
        expect(prompt).toContain("répartis weightPercent équitablement");
        expect(prompt).toContain("répartis 100 points en nombres entiers");
        expect(prompt).toContain("Conserve les critères dans leur ordre d’apparition");
        expect(prompt).toContain("utilise exactement \"Non renseigné\"");
        expect(prompt).toContain('Utilise toujours visibility="public" et organizationId=null');
        expect(prompt).toContain("génère uniquement un JSON valide");
        expect(prompt).toContain("fichier portant l’extension .json");
        expect(prompt).toContain("directement importable dans MaiaCoach");
        expect(prompt).not.toContain("Ne produis pas de JSON");
        expect(prompt).not.toContain('"status":');
    });

    it("keeps the generated example aligned with the default 100-point distribution", () => {
        const prompt = buildScorecardJsonPrefillPrompt(options);
        const structure = prompt.split("Respecte exactement cette structure :\n\n")[1];
        const example = JSON.parse(structure) as {
            data: { steps: Array<{ criteria: Array<{ maxPoints: number }> }> };
        };
        const totalPoints = example.data.steps.reduce(
            (total, step) => total + step.criteria.reduce((stepTotal, criterion) => stepTotal + criterion.maxPoints, 0),
            0,
        );

        expect(totalPoints).toBe(100);
    });
});
