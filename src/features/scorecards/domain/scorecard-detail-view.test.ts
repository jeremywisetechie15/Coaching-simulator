import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { SkillOption } from "@/features/skills/domain/skills";
import type { ScorecardDetail } from "./scorecard";
import { getScorecardViewStats, mapScorecardDetailToView } from "./scorecard-detail-view";

const scorecardDetail: ScorecardDetail = {
    category: "Prospection",
    createdAt: "2026-06-29T12:00:00.000Z",
    criteriaCount: 2,
    description: "Grille de notation DAGO.",
    domain: "Commercial",
    id: "scorecard-1",
    level: "Moyen",
    methodId: "method-1",
    methodName: "DAGO",
    name: "Scorecard DAGO",
    organizationId: null,
    status: CONTENT_STATUS.published,
    stepCount: 1,
    steps: [
        {
            criteria: [
                {
                    aiInstruction: "",
                    competenceId: "skill-1",
                    dimension: "savoir_faire",
                    dimensionItemId: "dimension-item-1",
                    expectedEvidence: "Demande courte et claire.",
                    id: "criterion-1",
                    key: "Formulation courte",
                    maxPoints: 4,
                    order: 1,
                    verbatim: "Pouvez-vous me le passer ?",
                },
                {
                    aiInstruction: "",
                    competenceId: "unknown-skill",
                    dimension: "savoir_etre",
                    dimensionItemId: "dimension-item-2",
                    expectedEvidence: "Ton calme et professionnel.",
                    id: "criterion-2",
                    key: "Posture professionnelle",
                    maxPoints: 3,
                    order: 2,
                    verbatim: "Merci, je rappelle à 14h.",
                },
            ],
            id: "step-1",
            methodStepId: "method-step-1",
            name: "Démarrer l'appel",
            order: 1,
            weightPercent: 100,
        },
    ],
    visibility: "public",
};

const skillOptions: SkillOption[] = [
    {
        dimensionItems: [],
        domain: "Commercial",
        id: "skill-1",
        name: "Accès au décideur",
    },
];

describe("scorecard detail view mapper", () => {
    it("maps DB scorecard details to the detail page view model", () => {
        const view = mapScorecardDetailToView(scorecardDetail, skillOptions);

        expect(view).toMatchObject({
            description: "Grille de notation DAGO.",
            id: "scorecard-1",
            level: "Moyen",
            methodName: "DAGO",
            name: "Scorecard DAGO",
        });
        expect(view.steps[0].title).toBe("Démarrer l'appel");
        expect(view.steps[0].criteria[0].competenceName).toBe("Accès au décideur");
        expect(view.steps[0].criteria[1].competenceName).toBe("unknown-skill");
        expect(getScorecardViewStats(view)).toEqual({
            competenceCount: 2,
            criteriaCount: 2,
            stepCount: 1,
            totalPoints: 7,
        });
    });
});
