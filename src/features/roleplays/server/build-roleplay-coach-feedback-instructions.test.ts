import { describe, expect, it } from "vitest";
import type { RoleplayCoachContext } from "./get-roleplay-coach-context";
import { buildRoleplayCoachFeedbackInstructions } from "./build-roleplay-coach-feedback-instructions";

const context = {
    method: null,
    methodSteps: [],
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
    scorecard: null,
    selectedStep: null,
} satisfies RoleplayCoachContext;

describe("buildRoleplayCoachFeedbackInstructions", () => {
    it("anchors the concise coach feedback to the learner and evaluated session", () => {
        const instructions = buildRoleplayCoachFeedbackInstructions({
            coachInstructions: "Donne un avis court et bienveillant.",
            context,
            evaluation: {
                appreciation: "Une session structurée.",
                scoreGlobal: { valeur: 74 },
                synthese: {
                    axes_amelioration: ["Préciser l'accroche"],
                    points_positifs: ["Bonne écoute"],
                },
            },
            learnerName: "Paul",
            transcript: "[Utilisateur]: Bonjour",
        });

        expect(instructions).toContain("Prénom ou nom à utiliser pour le saluer: Paul");
        expect(instructions).toContain("Une session structurée.");
        expect(instructions).toContain("Bonne écoute");
        expect(instructions).toContain("Préciser l'accroche");
        expect(instructions).toContain("[Utilisateur]: Bonjour");
        expect(instructions).toContain("Ne transforme pas cet avis initial en entraînement");
    });
});
