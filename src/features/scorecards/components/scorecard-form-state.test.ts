import { describe, expect, it } from "vitest";
import { CONTENT_STATUS } from "@/features/content/domain";
import type { ScorecardDetail } from "@/features/scorecards/domain";
import { scorecardDetailToFormState, toSaveScorecardInput } from "./scorecard-form-state";

const scorecardDetail: ScorecardDetail = {
    category: "Prospection",
    createdAt: "2026-06-29T12:00:00.000Z",
    criteriaCount: 1,
    description: "Scorecard de notation.",
    domain: "Commercial",
    id: "scorecard-1",
    level: "Moyen",
    methodId: "11111111-1111-4111-8111-111111111111",
    methodName: "DAGO",
    name: "Scorecard DAGO",
    organizationId: "22222222-2222-4222-8222-222222222222",
    status: CONTENT_STATUS.published,
    stepCount: 1,
    steps: [
        {
            criteria: [
                {
                    aiInstruction: "Évaluer la clarté de la demande.",
                    competenceId: "acces-decideur",
                    dimension: "savoir_faire",
                    dimensionItemId: "33333333-3333-4333-8333-333333333333",
                    expectedEvidence: "Demande courte et claire.",
                    id: "criterion-1",
                    key: "Formuler la demande",
                    maxPoints: 4,
                    order: 1,
                    verbatim: "Pouvez-vous me le passer ?",
                },
            ],
            id: "scorecard-step-1",
            methodStepId: "44444444-4444-4444-8444-444444444444",
            name: "Démarrer",
            order: 1,
        },
    ],
    visibility: "private",
};

describe("scorecard form state", () => {
    it("prefills the edit form from a DB scorecard detail", () => {
        const form = scorecardDetailToFormState(scorecardDetail);

        expect(form).toMatchObject({
            category: "Prospection",
            description: "Scorecard de notation.",
            domain: "Commercial",
            level: "Moyen",
            methodId: "11111111-1111-4111-8111-111111111111",
            name: "Scorecard DAGO",
            organizationId: "22222222-2222-4222-8222-222222222222",
            visibility: "private",
        });
        expect(form.steps[0]).toMatchObject({
            id: "scorecard-step-1",
            methodStepId: "44444444-4444-4444-8444-444444444444",
            name: "Démarrer",
            order: 1,
        });
        expect(form.steps[0].criteria[0]).toMatchObject({
            competenceId: "acces-decideur",
            dimension: "savoir_faire",
            dimensionItemId: "33333333-3333-4333-8333-333333333333",
            expectedEvidence: "Demande courte et claire.",
            key: "Formuler la demande",
            maxPoints: "4",
            order: "1",
            verbatim: "Pouvez-vous me le passer ?",
        });

        expect(toSaveScorecardInput(form, CONTENT_STATUS.published)).toMatchObject({
            methodId: "11111111-1111-4111-8111-111111111111",
            name: "Scorecard DAGO",
            organizationId: "22222222-2222-4222-8222-222222222222",
            steps: [
                {
                    criteria: [
                        {
                            competenceId: "acces-decideur",
                            dimension: "savoir_faire",
                            dimensionItemId: "33333333-3333-4333-8333-333333333333",
                            maxPoints: 4,
                            order: 1,
                        },
                    ],
                    methodStepId: "44444444-4444-4444-8444-444444444444",
                },
            ],
            visibility: "private",
        });
    });
});
