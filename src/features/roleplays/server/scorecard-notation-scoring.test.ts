import { describe, expect, it } from "vitest";
import type { RoleplayNotationCriterionRef, RoleplayNotationStepRef } from "@/features/roleplays/domain";
import {
    buildScoreGlobalFromScorecard,
    calculateScorecardNotationResult,
    validateScorecardMethodoResult,
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
        stepRef: "S1",
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
        stepRef: "S1",
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
        stepRef: "S2",
        stepTitle: "Confirmer",
        verbatim: "Je vous propose de bloquer un créneau.",
    },
];

const stepRefs: RoleplayNotationStepRef[] = [
    {
        code: "DISCOVER",
        methodStepId: "method-step-1",
        order: 1,
        ref: "S1",
        scorecardStepId: "scorecard-step-1",
        title: "Découvrir",
        weightPercent: 40,
    },
    {
        code: "CONFIRM",
        methodStepId: "method-step-2",
        order: 2,
        ref: "S2",
        scorecardStepId: "scorecard-step-2",
        title: "Confirmer",
        weightPercent: 60,
    },
];

describe("scorecard notation scoring", () => {
    it("averages criteria equally inside each step then applies explicit step weights", () => {
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
            stepRefs,
        );

        expect(result.pointsAwarded).toBe(10);
        expect(result.pointsMax).toBe(15);
        expect(result.globalScorePercent).toBe(81.67);
        expect(result.steps).toMatchObject([
            {
                pointsAwarded: 5,
                pointsMax: 10,
                scorePercent: 54.17,
                stepOrder: 1,
                weightPercent: 40,
            },
            {
                pointsAwarded: 5,
                pointsMax: 5,
                scorePercent: 100,
                stepOrder: 2,
                weightPercent: 60,
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
            stepRefs,
        );

        expect(result.criteria.map((criterion) => ({
            pointsAwarded: criterion.pointsAwarded,
            ref: criterion.ref,
        }))).toEqual([
            { ref: "C1", pointsAwarded: 4 },
            { ref: "C2", pointsAwarded: 0 },
            { ref: "C3", pointsAwarded: 0 },
        ]);
        expect(result.globalScorePercent).toBe(20);
    });

    it("maps legacy schema criterion code, normalized score and evidence arrays", () => {
        const result = calculateScorecardNotationResult(
            {
                etapes: [
                    {
                        titre: "Découvrir",
                        grille_calcul: {
                            criteres: [
                                {
                                    code: "C1",
                                    score_obtenu: 50,
                                    score_max: 100,
                                    preuves_observees: [
                                        {
                                            speaker: "Apprenant",
                                            timecode: "00:12",
                                            texte: "Quel est votre enjeu prioritaire ?",
                                        },
                                    ],
                                    justification_score: "Question posée mais qualification partielle.",
                                    conseils_amelioration: ["Creuser l'impact métier avant de poursuivre."],
                                },
                            ],
                        },
                    },
                ],
            },
            refs,
            stepRefs,
        );

        expect(result.criteria[0]).toMatchObject({
            advice: "Creuser l'impact métier avant de poursuivre.",
            coachComment: "Question posée mais qualification partielle.",
            evidence: "00:12 Apprenant: Quel est votre enjeu prioritaire ?",
            pointsAwarded: 2,
            ref: "C1",
            scorePercent: 50,
        });
        expect(result.globalScorePercent).toBe(10);
    });

    it("builds a score_global payload with explicit step weights", () => {
        const result = calculateScorecardNotationResult(
            {
                criteria_results: [
                    { ref: "C1", points_awarded: 4 },
                    { ref: "C2", points_awarded: 6 },
                    { ref: "C3", points_awarded: 0 },
                ],
            },
            refs,
            stepRefs,
        );

        expect(buildScoreGlobalFromScorecard(result)).toMatchObject({
            methode_calcul: "moyenne_criteres_puis_ponderation_etapes_scorecard",
            notation_source: "scorecard",
            points_max: 15,
            points_obtenus: 10,
            valeur: 40,
            detail_calcul: [
                {
                    etape: "Découvrir",
                    poids: 0.4,
                    score_etape: 100,
                },
                {
                    etape: "Confirmer",
                    poids: 0.6,
                    score_etape: 0,
                },
            ],
        });
    });

    it("accepts one complete and nuanced result per criterion", () => {
        expect(validateScorecardMethodoResult({
            criteres: [
                { ref: "C1", points_obtenus: 3.2, points_max: 4 },
                { ref: "C2", points_obtenus: 4.2, points_max: 6 },
                { ref: "C3", points_obtenus: 3.35, points_max: 5 },
            ],
        }, refs)).toEqual([]);
    });

    it("rejects missing, duplicate, unknown and out-of-range criterion results", () => {
        const errors = validateScorecardMethodoResult({
            criteres: [
                { ref: "C1", points_obtenus: 5, points_max: 4 },
                { ref: "C1", points_obtenus: 4, points_max: 4 },
                { ref: "C999", points_obtenus: 1, points_max: 1 },
                { ref: "C3", points_obtenus: 2.5, points_max: 4 },
            ],
        }, refs);

        expect(errors).toContain("Reference de critere dupliquee: C1.");
        expect(errors).toContain("Reference de critere inconnue: C999.");
        expect(errors).toContain("Resultat manquant pour C2.");
        expect(errors).toContain("points_max invalide pour C3: attendu 5.");
        expect(errors).toContain("points_obtenus hors limites pour C1.");
    });
});
