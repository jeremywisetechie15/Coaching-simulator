import { describe, expect, it } from "vitest";
import { buildRoleplayPersonaFeedbackInstructions } from "./build-roleplay-persona-feedback-instructions";
import type { RoleplayCoachContext } from "./get-roleplay-coach-context";
import {
    buildRoleplayPersonaSimulationInstructions,
    serializeRoleplayCoachContext,
    serializeRoleplayPersonaSimulationContext,
} from "./get-roleplay-coach-context";

const selectedStep = {
    bestPractices: ["Poser une question ouverte"],
    code: "D",
    id: "step-1",
    objectives: ["Comprendre les enjeux"],
    order: 1,
    pitfalls: ["Présenter la solution trop tôt"],
    posture: ["Écoute active"],
    summary: "Explorer la situation du client",
    takeaway: "Comprendre avant de proposer",
    title: "Découvrir",
    verbatims: ["Qu'est-ce qui est prioritaire pour vous ?"],
    weight: 25,
};

const context: RoleplayCoachContext = {
    method: {
        category: "Vente",
        challenges: ["Structurer la découverte"],
        code: "TEST",
        description: "Méthode de test",
        domain: "Commercial",
        id: "method-1",
        name: "Méthode dynamique",
        objectives: ["Mener un entretien consultatif"],
        version: "1",
    },
    methodSteps: [selectedStep],
    persona: {
        age: 42,
        annualRevenue: "5 M€",
        avatarUrl: "https://example.com/persona.webp",
        childrenCount: 2,
        company: "Entreprise test",
        companyDescription: "Éditeur B2B",
        diploma: "Master commerce",
        discProfile: "Stable",
        employeeCount: 50,
        industry: "Technologie",
        maritalStatus: "Marié",
        name: "Persona dynamique",
        nationality: "Française",
        netIncomeBeforeTax: "4 500 €",
        residenceCountry: "France",
        role: "Direction commerciale",
        systemInstructions: "Reste exigeant et factuel.",
        voiceId: "alloy",
    },
    scenario: {
        backgroundImagePath: "roleplays/scenario-1/background.webp",
        category: "Découverte",
        coachingSteps: "Faire reformuler l'apprenant.",
        context: "Premier échange",
        description: "Comprendre les priorités du prospect",
        difficulty: "Moyen",
        discProfile: "Stable",
        domain: "Commercial",
        id: "scenario-1",
        objective: "Obtenir un prochain rendez-vous",
        obstacles: "Manque de temps",
        title: "Roleplay dynamique",
    },
    scorecard: {
        category: "Prospection",
        description: "Grille de qualification",
        domain: "Commercial",
        id: "scorecard-1",
        level: "Intermédiaire",
        methodId: "method-1",
        name: "Scorecard dynamique",
        steps: [{
            criteria: [{
                aiInstruction: "Chercher une question ouverte dans le transcript.",
                criterionKey: "question_ouverte",
                dimension: "savoir_faire",
                dimensionItemId: "dimension-item-1",
                dimensionItemLabel: "Questionnement ouvert",
                expectedEvidence: "Une question ouverte adaptée au contexte",
                id: "criterion-1",
                maxPoints: 4,
                order: 1,
                skillId: "skill-1",
                skillName: "Découverte du besoin",
                verbatim: "Qu'est-ce qui est prioritaire pour vous ?",
            }],
            id: "scorecard-step-1",
            methodStepId: "step-1",
            order: 1,
            title: "Découvrir",
        }],
    },
    selectedStep,
};

describe("serializeRoleplayCoachContext", () => {
    it("includes only the selected step when coaching targets one step", () => {
        const result = serializeRoleplayCoachContext(context);
        const parsed = JSON.parse(result);

        expect(result).toContain('"name": "Méthode dynamique"');
        expect(result).toContain('"name": "Persona dynamique"');
        expect(result).toContain('"title": "Roleplay dynamique"');
        expect(result).toContain('"bestPractices"');
        expect(result).toContain('"pitfalls"');
        expect(result).toContain('"posture"');
        expect(result).toContain('"verbatims"');
        expect(result).toContain('"name": "Scorecard dynamique"');
        expect(result).toContain('"expectedEvidence"');
        expect(parsed.selectedStep).toEqual(selectedStep);
        expect(parsed.scorecard.steps).toHaveLength(1);
        expect(parsed.scorecard.steps[0].criteria[0]).toMatchObject({
            dimensionItemLabel: "Questionnement ouvert",
            skillName: "Découverte du besoin",
        });
        expect(parsed.scorecard.id).toBeUndefined();
        expect(parsed.scorecard.steps[0].criteria[0].id).toBeUndefined();
        expect(parsed.methodSteps).toBeUndefined();
    });

    it("includes all method steps for a global after-training debrief", () => {
        const result = JSON.parse(serializeRoleplayCoachContext({
            ...context,
            selectedStep: null,
        }));

        expect(result.selectedStep).toBeNull();
        expect(result.method).toEqual(context.method);
        expect(result.methodSteps).toEqual([selectedStep]);
        expect(result.scorecard.name).toBe("Scorecard dynamique");
    });

    it("serializes the complete business context for a persona simulation", () => {
        const result = JSON.parse(serializeRoleplayPersonaSimulationContext(context));

        expect(result.persona).toMatchObject({
            childrenCount: 2,
            diploma: "Master commerce",
            maritalStatus: "Marié",
            nationality: "Française",
            netIncomeBeforeTax: "4 500 €",
            residenceCountry: "France",
        });
        expect(result.scenario).toMatchObject({
            context: "Premier échange",
            difficulty: "Moyen",
            discProfile: "Stable",
            objective: "Obtenir un prochain rendez-vous",
            obstacles: "Manque de temps",
        });
        expect(result.method).toBeUndefined();
        expect(result.methodSteps).toBeUndefined();
        expect(result.scorecard).toBeUndefined();
        expect(result.persona.systemInstructions).toBeUndefined();
        expect(result.persona.avatarUrl).toBeUndefined();
        expect(result.persona.voiceId).toBeUndefined();
        expect(result.scenario.backgroundImagePath).toBeUndefined();
    });

    it("builds persona instructions from the configured system prompt and dynamic roleplay context", () => {
        const result = buildRoleplayPersonaSimulationInstructions(context);

        expect(result).toContain("Reste exigeant et factuel.");
        expect(result).toContain('"name":"Persona dynamique"');
        expect(result).toContain('"title":"Roleplay dynamique"');
        expect(result).not.toContain('"name":"Méthode dynamique"');
        expect(result).not.toContain('"title":"Découvrir"');
        expect(result).toContain("Ne deviens jamais coach, formateur ou évaluateur.");
        expect(result.match(/Reste exigeant et factuel\./g)).toHaveLength(1);
    });

    it("builds post-session persona feedback with the full business context only", () => {
        const result = buildRoleplayPersonaFeedbackInstructions({
            basePrompt: "Donne ton ressenti après la session.",
            context,
            transcript: "[Utilisateur]: Bonjour",
            writtenFeedback: "L'approche était trop générique.",
        });

        expect(result).toContain('"companyDescription":"Éditeur B2B"');
        expect(result).toContain('"objective":"Obtenir un prochain rendez-vous"');
        expect(result).toContain('"obstacles":"Manque de temps"');
        expect(result).toContain("L'approche était trop générique.");
        expect(result).toContain("[Utilisateur]: Bonjour");
        expect(result).not.toContain('"name":"Méthode dynamique"');
        expect(result).not.toContain('"name":"Scorecard dynamique"');
        expect(result.match(/Reste exigeant et factuel\./g)).toHaveLength(1);
    });
});
