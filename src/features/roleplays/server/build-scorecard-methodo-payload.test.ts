import { describe, expect, it } from "vitest";
import type {
    RoleplayNotationCriterionRef,
    RoleplayNotationScoreResult,
} from "@/features/roleplays/domain";
import type { RoleplayScorecardNotationContext } from "./build-roleplay-notation-context";
import { buildScorecardMethodoPayload } from "./build-scorecard-methodo-payload";

const criterionRefs: RoleplayNotationCriterionRef[] = [
    {
        criterionKey: "Cadrer l'échange",
        dimension: "savoir_faire",
        dimensionItemId: "dimension-item-1",
        dimensionItemLabel: "Cadrage",
        expectedEvidence: "L'apprenant annonce clairement l'objectif.",
        maxPoints: 2,
        methodStepId: "method-step-1",
        ref: "C1",
        scorecardCriterionId: "criterion-1",
        scorecardStepId: "scorecard-step-1",
        skillId: "skill-1",
        skillName: "Cadrage",
        stepOrder: 1,
        stepRef: "S1",
        stepTitle: "Cadrer",
        verbatim: "Pour bien cadrer notre échange, quelles sont vos priorités ?",
    },
];

const transcription: RoleplayScorecardNotationContext["transcription"] = {
    conversation: [
        {
            etape_methodo: null,
            id: 1,
            is_ai_response: false,
            speaker: "Apprenant",
            timecode_absolute: "12:00:00",
            timecode_relative: "00:00:00",
            verbatim: "Avant de rentrer dans les possibilités, parlons de vos priorités.",
        },
    ],
    exclude_from_global_score: true,
    messages_apprenant: 1,
    messages_persona: 0,
    onglet: "Transcription",
    total_messages: 1,
};

function scoreResult(pointsAwarded: number): RoleplayNotationScoreResult {
    const criterion = {
        advice: "Rendre le cadrage plus direct.",
        coachComment: "Le cadrage reste implicite.",
        evidence: "M1",
        pointsAwarded,
        pointsMax: 2,
        ref: "C1",
        scorePercent: pointsAwarded * 50,
    };

    return {
        criteria: [criterion],
        globalScorePercent: criterion.scorePercent,
        pointsAwarded,
        pointsMax: 2,
        steps: [
            {
                coachComment: criterion.coachComment,
                criteria: [criterion],
                methodStepId: "method-step-1",
                pointsAwarded,
                pointsMax: 2,
                scorePercent: criterion.scorePercent,
                scorecardStepId: "scorecard-step-1",
                stepOrder: 1,
                title: "Cadrer",
                weightPercent: 100,
            },
        ],
    };
}

const correction = {
    message_ref: "M1",
    phrase_originale: "parlons de vos priorités",
    pourquoi: "La nouvelle formulation annonce plus clairement l'objectif.",
    verbatim_preconise: "Pour bien cadrer notre échange, quelles sont vos priorités ?",
};

describe("build scorecard methodo payload", () => {
    it("persists one validated correction for an incomplete criterion", () => {
        const payload = buildScorecardMethodoPayload(
            {
                criteres: [{ correction, ref: "C1" }],
                onglet: "AnalyseMethodologique",
            },
            scoreResult(1),
            criterionRefs,
            transcription,
        );

        expect(payload).not.toHaveProperty("criteres");
        expect(payload.etapes[0].criteres[0]).toMatchObject({
            correction,
            points_obtenus: 1,
            points_max: 2,
            verbatim: criterionRefs[0].verbatim,
        });
    });

    it("forces correction to null when the normalized criterion score is complete", () => {
        const payload = buildScorecardMethodoPayload(
            { criteres: [{ correction, ref: "C1" }] },
            scoreResult(2),
            criterionRefs,
            transcription,
        );

        expect(payload.etapes[0].criteres[0].correction).toBeNull();
    });

    it("drops a semantically invalid correction without altering criterion scoring", () => {
        const payload = buildScorecardMethodoPayload(
            {
                criteres: [{
                    correction: { ...correction, phrase_originale: "Une phrase inventée" },
                    ref: "C1",
                }],
            },
            scoreResult(1),
            criterionRefs,
            transcription,
        );

        expect(payload.etapes[0].criteres[0]).toMatchObject({
            correction: null,
            points_obtenus: 1,
            score: 50,
        });
    });

    it("caps corrections per phrase without removing criteria or changing their scores", () => {
        const repeatedCriterionRefs = Array.from({ length: 3 }, (_, index) => ({
            ...criterionRefs[0],
            criterionKey: `Critère ${index + 1}`,
            dimensionItemId: `dimension-item-${index + 1}`,
            ref: `C${index + 1}`,
            scorecardCriterionId: `criterion-${index + 1}`,
        }));
        const criteria = repeatedCriterionRefs.map((criterionRef, index) => ({
            advice: `Conseil ${index + 1}`,
            coachComment: `Commentaire ${index + 1}`,
            evidence: "M1",
            pointsAwarded: 1,
            pointsMax: 2,
            ref: criterionRef.ref,
            scorePercent: 50,
        }));
        const repeatedScoreResult: RoleplayNotationScoreResult = {
            criteria,
            globalScorePercent: 50,
            pointsAwarded: 3,
            pointsMax: 6,
            steps: [{
                coachComment: "Trois critères évalués.",
                criteria,
                methodStepId: "method-step-1",
                pointsAwarded: 3,
                pointsMax: 6,
                scorePercent: 50,
                scorecardStepId: "scorecard-step-1",
                stepOrder: 1,
                title: "Cadrer",
                weightPercent: 100,
            }],
        };
        const payload = buildScorecardMethodoPayload(
            {
                criteres: repeatedCriterionRefs.map((criterionRef, index) => ({
                    correction: {
                        ...correction,
                        phrase_originale: index === 2
                            ? "Avant de rentrer dans les possibilités, parlons de vos priorités."
                            : correction.phrase_originale,
                        pourquoi: `Pourquoi ${index + 1}`,
                        verbatim_preconise: `Verbatim recommandé ${index + 1}`,
                    },
                    ref: criterionRef.ref,
                })),
            },
            repeatedScoreResult,
            repeatedCriterionRefs,
            transcription,
        );
        const persistedCriteria = payload.etapes[0].criteres;

        expect(persistedCriteria).toHaveLength(3);
        expect(persistedCriteria.map((criterion) => criterion.points_obtenus)).toEqual([1, 1, 1]);
        expect(persistedCriteria.map((criterion) => criterion.score)).toEqual([50, 50, 50]);
        expect(persistedCriteria.filter((criterion) => criterion.correction)).toHaveLength(2);
        expect(persistedCriteria[2].correction).toBeNull();
    });
});
