import { describe, expect, it } from "vitest";
import type { RoleplayScorecardNotationContext } from "./build-roleplay-notation-context";
import { buildScorecardMethodoInput, buildScorecardSynthesisInput } from "./scorecard-notation-inputs";

const context = {
    criterionRefs: [{
        criterionKey: "Qualifier l'enjeu",
        dimension: "savoir_faire",
        dimensionItemId: "item-1",
        dimensionItemLabel: "Questionnement",
        expectedEvidence: "L'enjeu est explicite.",
        maxPoints: 4,
        methodStepId: "method-step-1",
        ref: "C1",
        scorecardCriterionId: "criterion-1",
        scorecardStepId: "scorecard-step-1",
        skillId: "skill-1",
        skillName: "Découverte",
        stepOrder: 1,
        stepRef: "S1",
        stepTitle: "Découvrir",
        verbatim: "Quel est votre enjeu ?",
    }],
    method: {
        category: "Prospection",
        challenges: ["Créer de l'intérêt"],
        code: "CUSTOM",
        description: "Une méthode personnalisée.",
        domain: "Commercial",
        id: "method-1",
        name: "Méthode personnalisée",
        objectives: ["Obtenir un rendez-vous"],
        steps: [{
            bestPractices: ["Questionner"],
            code: "DISCOVER",
            id: "method-step-1",
            objectives: ["Comprendre"],
            order: 1,
            pitfalls: ["Présenter trop tôt"],
            posture: ["Écoute active"],
            summary: "Explorer le besoin.",
            takeaway: "Comprendre avant de proposer.",
            title: "Découvrir",
            verbatims: ["Quel est votre enjeu ?"],
            weight: 100,
        }],
        version: "1",
    },
    persona: {
        age: 42,
        annualRevenue: "5 M€",
        childrenCount: 2,
        company: "Entreprise test",
        companyDescription: "Éditeur B2B",
        diploma: "Master",
        discProfile: "Stable",
        employeeCount: 50,
        industry: "Technologie",
        maritalStatus: "Marié",
        name: "Richard Martin",
        nationality: "Française",
        netIncomeBeforeTax: "4 500 €",
        residenceCountry: "France",
        role: "Directeur commercial",
        systemInstructions: "Reste factuel et pressé.",
    },
    scenario: {
        category: "Prospection",
        coachingSteps: "Faire préciser la valeur.",
        context: "Premier appel.",
        description: "Contacter un prospect.",
        difficulty: "Intermédiaire",
        discProfile: "Stable",
        domain: "Commercial",
        id: "scenario-1",
        objective: "Obtenir un rendez-vous.",
        obstacles: "Le prospect manque de temps.",
        title: "Prise de rendez-vous",
    },
    scorecard: {
        category: "Prospection",
        description: "Grille structurée.",
        domain: "Commercial",
        id: "scorecard-1",
        level: "Intermédiaire",
        name: "Scorecard test",
        steps: [{
            criteria: [{
                aiInstruction: "Chercher une question ouverte.",
                criterionKey: "Qualifier l'enjeu",
                dimension: "savoir_faire",
                dimensionItemLabel: "Questionnement",
                expectedEvidence: "L'enjeu est explicite.",
                maxPoints: 4,
                ref: "C1",
                skillName: "Découverte",
                verbatim: "Quel est votre enjeu ?",
            }],
            id: "scorecard-step-1",
            methodStepId: "method-step-1",
            order: 1,
            stepRef: "S1",
            title: "Découvrir",
            weightPercent: 100,
        }],
    },
    session: {
        completedAt: "2026-07-13T10:00:00.000Z",
        durationSeconds: 120,
        id: "session-1",
        scenarioId: "scenario-1",
        userId: "user-1",
    },
    stepRefs: [{
        code: "DISCOVER",
        methodStepId: "method-step-1",
        order: 1,
        ref: "S1",
        scorecardStepId: "scorecard-step-1",
        title: "Découvrir",
        weightPercent: 100,
    }],
    transcript: "[M1] [12:00:00] Utilisateur: Quel est votre enjeu ?",
    transcription: {
        conversation: [],
        exclude_from_global_score: true,
        messages_apprenant: 0,
        messages_persona: 0,
        onglet: "Transcription",
        total_messages: 0,
    },
} satisfies RoleplayScorecardNotationContext;

describe("scorecard notation inputs", () => {
    it("provides complete business context and generic refs to the methodo call", () => {
        const input = buildScorecardMethodoInput(context);

        expect(input).toContain('"systemInstructions": "Reste factuel et pressé."');
        expect(input).toContain('"coachingSteps": "Faire préciser la valeur."');
        expect(input).toContain('"category": "Prospection"');
        expect(input).toContain('"domain": "Commercial"');
        expect(input).toContain('"etape_ref": "S1"');
        expect(input).toContain('"weightPercent": 100');
        expect(input).toContain('"ref": "C1"');
        expect(input).toContain("points_obtenus peut etre nuance");
        expect(input).toContain("[M1] [12:00:00] Utilisateur");
    });

    it("provides the same context and computed scores to the synthesis call", () => {
        const input = buildScorecardSynthesisInput(context, {
            methodo: { onglet: "AnalyseMethodologique" },
            score_global: { valeur: 75 },
        });

        expect(input).toContain('"name": "Richard Martin"');
        expect(input).toContain('"name": "Scorecard test"');
        expect(input).toContain('"valeur": 75');
        expect(input).toContain('"ref": "S1"');
    });
});
