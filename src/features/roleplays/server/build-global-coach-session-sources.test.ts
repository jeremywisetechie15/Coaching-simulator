import { describe, expect, it } from "vitest";
import type { RoleplayCoachContext } from "./get-roleplay-coach-context";
import { buildGlobalCoachSessionSources } from "./build-global-coach-session-sources";

const context = {
    method: {
        category: "Vente",
        challenges: ["Qualifier le besoin"],
        code: "TEST",
        description: "Méthode de test",
        domain: "Commerce et développement commercial",
        id: "method-1",
        name: "Méthode test",
        objectives: ["Structurer l'entretien"],
        version: "1",
    },
    methodSteps: [],
    persona: {
        age: 42,
        annualRevenue: "5 M€",
        avatarUrl: null,
        childrenCount: 2,
        company: "Entreprise test",
        companyDescription: "Éditeur B2B",
        diploma: "Master commerce",
        discProfile: "Stable",
        employeeCount: 50,
        industry: "Technologie",
        maritalStatus: "Marié",
        name: "Persona test",
        nationality: "Française",
        netIncomeBeforeTax: "4 500 €",
        pcsGroup: "Cadres et professions intellectuelles supérieures",
        residenceCountry: "France",
        role: "Direction commerciale",
        sex: "Femme",
        systemInstructions: "Instruction persona à exclure.",
        voiceId: "alloy",
    },
    scenario: {
        activitySector: "Informatique, numérique et télécommunications",
        backgroundImagePath: null,
        category: "Découverte",
        coachingSteps: "Étapes de coaching à exclure.",
        context: "Premier échange",
        description: "Comprendre les priorités",
        difficulty: "Moyen",
        discProfile: "Stable",
        domain: "Commerce et développement commercial",
        id: "scenario-1",
        objective: "Obtenir un rendez-vous",
        obstacles: "Manque de temps",
        title: "Roleplay test",
    },
    scorecard: null,
    selectedStep: null,
} satisfies RoleplayCoachContext;

describe("buildGlobalCoachSessionSources", () => {
    it("shares one compact factual payload between Ask IA Coach and Debrief", () => {
        const sources = buildGlobalCoachSessionSources({
            context,
            evaluation: {
                appreciationGlobale: "Une session structurée.",
                axesAmelioration: ["Préciser l'accroche"],
                momentsCles: [],
                planDeProgres: [],
                pointsPositifs: ["Bonne écoute"],
                prioriteStrategique: "Clarifier l'objectif.",
                scoreGlobal: 74,
            },
            transcript: "[Utilisateur]: Bonjour",
        });

        expect(sources).toContain("ÉVALUATION STRUCTURÉE DE LA SESSION");
        expect(sources).toContain("[Utilisateur]: Bonjour");
        expect(sources.match(/Une session structurée\./g)).toHaveLength(1);
        expect(sources).not.toContain("Étapes de coaching à exclure.");
        expect(sources).not.toContain("Instruction persona à exclure.");
        expect(sources).not.toContain("4 500 €");
    });
});
