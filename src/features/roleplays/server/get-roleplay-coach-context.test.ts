import { describe, expect, it } from "vitest";
import type { RoleplayCoachContext } from "./get-roleplay-coach-context";
import { serializeRoleplayCoachContext } from "./get-roleplay-coach-context";

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
        challenges: ["Structurer la découverte"],
        code: "TEST",
        description: "Méthode de test",
        id: "method-1",
        name: "Méthode dynamique",
        objectives: ["Mener un entretien consultatif"],
        version: "1",
    },
    methodSteps: [selectedStep],
    persona: {
        age: 42,
        annualRevenue: "5 M€",
        company: "Entreprise test",
        companyDescription: "Éditeur B2B",
        discProfile: "Stable",
        employeeCount: 50,
        industry: "Technologie",
        name: "Persona dynamique",
        role: "Direction commerciale",
    },
    scenario: {
        category: "Découverte",
        context: "Premier échange",
        description: "Comprendre les priorités du prospect",
        difficulty: "Moyen",
        domain: "Commercial",
        id: "scenario-1",
        objective: "Obtenir un prochain rendez-vous",
        obstacles: "Manque de temps",
        title: "Roleplay dynamique",
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
        expect(parsed.selectedStep).toEqual(selectedStep);
        expect(parsed.methodSteps).toBeUndefined();
    });

    it("includes all method steps for a global after-training debrief", () => {
        const result = JSON.parse(serializeRoleplayCoachContext({
            ...context,
            selectedStep: null,
        }));

        expect(result.selectedStep).toBeNull();
        expect(result.methodSteps).toEqual([selectedStep]);
    });
});
