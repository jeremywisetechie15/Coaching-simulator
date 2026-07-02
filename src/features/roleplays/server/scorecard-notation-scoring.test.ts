import { describe, expect, it } from "vitest";
import type { RoleplayNotationCriterionRef } from "@/features/roleplays/domain";
import {
    buildScoreGlobalFromScorecard,
    calculateScorecardNotationResult,
} from "./scorecard-notation-scoring";

const refs: RoleplayNotationCriterionRef[] = [
    {
        criterionKey: "Identifier le besoin",
        dimension: "savoir_faire",
        dimensionItemId: "dimension-item-1",
        dimensionItemLabel: "Questionnement",
        expectedEvidence: "Le besoin prioritaire est explicité.",
        maxPoints: 4,
        methodStepId: "method-step-1",
        ref: "C1",
        scorecardCriterionId: "criterion-1",
        scorecardStepId: "scorecard-step-1",
        skillId: "decouverte-besoin",
        skillName: "Découverte du besoin",
        stepOrder: 1,
        stepTitle: "Découvrir",
        verbatim: "Quel est votre enjeu prioritaire ?",
    },
    {
        criterionKey: "Reformuler",
        dimension: "savoir_faire",
        dimensionItemId: "dimension-item-2",
        dimensionItemLabel: "Reformulation",
        expectedEvidence: "Le besoin est reformulé avant la suite.",
        maxPoints: 6,
        methodStepId: "method-step-1",
        ref: "C2",
        scorecardCriterionId: "criterion-2",
        scorecardStepId: "scorecard-step-1",
        skillId: "reformulation",
        skillName: "Reformulation",
        stepOrder: 1,
        stepTitle: "Découvrir",
        verbatim: "Si je comprends bien...",
    },
    {
        criterionKey: "Conclure",
        dimension: "savoir_etre",
        dimensionItemId: "dimension-item-3",
        dimensionItemLabel: "Assurance",
        expectedEvidence: "Le commercial propose une suite claire.",
        maxPoints: 5,
        methodStepId: "method-step-2",
        ref: "C3",
        scorecardCriterionId: "criterion-3",
        scorecardStepId: "scorecard-step-2",
        skillId: "conclusion",
        skillName: "Conclusion",
        stepOrder: 2,
        stepTitle: "Confirmer",
        verbatim: "Je vous propose de bloquer un créneau.",
    },
];

describe("scorecard notation scoring", () => {
    it("calculates global and step scores from criterion points when total is not 100", () => {
        const result = calculateScorecardNotationResult(
            {
                etapes: [
                    {
                        titre: "Découvrir",
                        criteres: [
                            { ref: "C1", points_obtenus: 3, preuve: "Question prioritaire posée." },
                            { ref: "C2", points_obtenus: 2, commentaire: "Reformulation partielle." },
                        ],
                    },
                    {
                        titre: "Confirmer",
                        criteres: [
                            { ref: "C3", points_obtenus: 5, conseil: "Conserver cette conclusion." },
                        ],
                    },
                ],
            },
            refs,
        );

        expect(result.pointsAwarded).toBe(10);
        expect(result.pointsMax).toBe(15);
        expect(result.globalScorePercent).toBe(66.67);
        expect(result.steps).toMatchObject([
            {
                pointsAwarded: 5,
                pointsMax: 10,
                scorePercent: 50,
                stepOrder: 1,
            },
            {
                pointsAwarded: 5,
                pointsMax: 5,
                scorePercent: 100,
                stepOrder: 2,
            },
        ]);
    });

    it("clamps criterion points and defaults missing criteria to zero", () => {
        const result = calculateScorecardNotationResult(
            {
                criteria_results: [
                    { ref: "C1", points_awarded: 99 },
                    { ref: "C999", points_awarded: 99 },
                ],
            },
            refs,
        );

        expect(result.criteria.map((criterion) => ({
            pointsAwarded: criterion.pointsAwarded,
            ref: criterion.ref,
        }))).toEqual([
            { ref: "C1", pointsAwarded: 4 },
            { ref: "C2", pointsAwarded: 0 },
            { ref: "C3", pointsAwarded: 0 },
        ]);
        expect(result.globalScorePercent).toBe(26.67);
    });

    it("builds a score_global payload with inferred step weights", () => {
        const result = calculateScorecardNotationResult(
            {
                criteria_results: [
                    { ref: "C1", points_awarded: 4 },
                    { ref: "C2", points_awarded: 6 },
                    { ref: "C3", points_awarded: 0 },
                ],
            },
            refs,
        );

        expect(buildScoreGlobalFromScorecard(result)).toMatchObject({
            methode_calcul: "somme_points_criteres_scorecard",
            notation_source: "scorecard",
            points_max: 15,
            points_obtenus: 10,
            valeur: 66.67,
            detail_calcul: [
                {
                    etape: "Découvrir",
                    poids: 0.67,
                    score_etape: 100,
                },
                {
                    etape: "Confirmer",
                    poids: 0.33,
                    score_etape: 0,
                },
            ],
        });
    });
});
