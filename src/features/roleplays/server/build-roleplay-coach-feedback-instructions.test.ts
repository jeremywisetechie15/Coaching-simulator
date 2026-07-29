import { describe, expect, it } from "vitest";
import type { RoleplayCoachContext } from "./get-roleplay-coach-context";
import { buildRoleplayCoachFeedbackInstructions } from "./build-roleplay-coach-feedback-instructions";

const context = {
    method: {
        category: "Vente",
        challenges: ["Créer de la confiance"],
        code: "TEST",
        description: "Une méthode de vente structurée.",
        domain: "Commercial",
        id: "method-1",
        name: "Méthode résumée",
        objectives: ["Structurer l'entretien"],
        version: "1",
    },
    methodSteps: [{
        bestPractices: ["Détail étape à ne pas transmettre"],
        code: "E1",
        id: "method-step-1",
        objectives: [],
        order: 1,
        pitfalls: [],
        posture: [],
        summary: "",
        takeaway: "",
        title: "Étape détaillée à exclure",
        verbatims: [],
        weight: 100,
    }],
    persona: null,
    scenario: {
        backgroundImagePath: null,
        category: "Vente",
        coachingSteps: "",
        context: "Entretien commercial",
        description: "Présenter une solution.",
        difficulty: "Intermédiaire",
        discProfile: "D",
        domain: "Commercial",
        id: "scenario-1",
        objective: "Obtenir une démonstration.",
        obstacles: "",
        title: "Prise de rendez-vous",
    },
    scorecard: {
        category: "Vente",
        description: "Scorecard à exclure",
        domain: "Commercial",
        id: "scorecard-1",
        level: "Intermédiaire",
        methodId: "method-1",
        name: "Scorecard détaillée",
        steps: [{
            criteria: [{
                aiInstruction: "Instruction de critère à ne pas transmettre",
                criterionKey: "critere_interdit",
                dimension: "savoir_faire",
                dimensionItemId: null,
                dimensionItemLabel: null,
                expectedEvidence: "Preuve détaillée à exclure",
                id: "criterion-1",
                maxPoints: 1,
                order: 1,
                skillId: "skill-1",
                skillName: "Compétence détaillée",
                verbatim: "Verbatim détaillé à exclure",
            }],
            id: "scorecard-step-1",
            methodStepId: "method-step-1",
            order: 1,
            title: "Étape scorecard",
            weightPercent: 100,
        }],
    },
    selectedStep: null,
} satisfies RoleplayCoachContext;

describe("buildRoleplayCoachFeedbackInstructions", () => {
    it("anchors the concise coach feedback to the learner and evaluated session", () => {
        const instructions = buildRoleplayCoachFeedbackInstructions({
            coachInstructions: "Donne un avis court et bienveillant.",
            context,
            evaluation: {
                appreciationGlobale: "Une session structurée.",
                axesAmelioration: ["Préciser l'accroche"],
                momentsCles: [],
                planDeProgres: [],
                pointsPositifs: ["Bonne écoute"],
                prioriteStrategique: "Clarifier l'ouverture.",
                scoreGlobal: 74,
            },
            learnerName: "Paul",
            transcript: "[Utilisateur]: Bonjour",
        });

        expect(instructions).toContain("Prénom ou nom à utiliser pour le saluer: Paul");
        expect(instructions).toContain('"name": "Méthode résumée"');
        expect(instructions).toContain("Une session structurée.");
        expect(instructions.match(/Une session structurée\./g)).toHaveLength(1);
        expect(instructions).toContain("Bonne écoute");
        expect(instructions).toContain("Préciser l'accroche");
        expect(instructions).toContain("[Utilisateur]: Bonjour");
        expect(instructions).toContain("Ne transforme pas cet avis initial en entraînement");
        expect(instructions).not.toContain("Étape détaillée à exclure");
        expect(instructions).not.toContain("Instruction de critère à ne pas transmettre");
        expect(instructions).not.toContain("Scorecard détaillée");
    });
});
