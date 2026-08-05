import { describe, expect, it } from "vitest";
import type {
    RoleplayNotationCriterionRef,
    RoleplayNotationStepRef,
    RoleplayNotationTranscriptPayload,
} from "@/features/roleplays/domain";
import {
    normalizeScorecardMethodoEvidence,
    SCORECARD_NO_LEARNER_EVIDENCE,
} from "./scorecard-notation-evidence";
import {
    buildScoreGlobalFromScorecard,
    calculateScorecardNotationResult,
} from "./scorecard-notation-scoring";

const transcript: RoleplayNotationTranscriptPayload = {
    conversation: [
        {
            etape_methodo: null,
            id: 1,
            is_ai_response: false,
            speaker: "Apprenant",
            timecode_absolute: "10:00:01",
            timecode_relative: "00:00:01",
            verbatim: "Quel est votre enjeu prioritaire ?",
        },
        {
            etape_methodo: null,
            id: 2,
            is_ai_response: true,
            speaker: "Persona",
            timecode_absolute: "10:00:04",
            timecode_relative: "00:00:04",
            verbatim: "J'ai encore quelques minutes devant moi.",
        },
        {
            etape_methodo: null,
            id: 3,
            is_ai_response: false,
            speaker: "Apprenant",
            timecode_absolute: "10:00:08",
            timecode_relative: "00:00:08",
            verbatim: "Je vous propose de clarifier d'abord votre priorité.",
        },
    ],
    exclude_from_global_score: true,
    messages_apprenant: 2,
    messages_persona: 1,
    onglet: "Transcription",
    total_messages: 3,
};

function criterion(overrides: Record<string, unknown>) {
    return {
        commentaire: "Commentaire",
        conseil: "Conseil",
        corrections: [],
        points_max: 2,
        preuve: "Texte libre non fiable",
        ref: "C1",
        ...overrides,
    };
}

describe("scorecard notation evidence", () => {
    it("produces a zero global score when the model awards points from persona-only evidence", () => {
        const criterionRefs: RoleplayNotationCriterionRef[] = [{
            criterionKey: "Vérifier la disponibilité",
            dimension: "savoir_faire",
            dimensionItemId: null,
            dimensionItemLabel: null,
            expectedEvidence: "L'apprenant vérifie que le client dispose de temps.",
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
            verbatim: "Avez-vous encore quelques minutes ?",
        }];
        const stepRefs: RoleplayNotationStepRef[] = [{
            code: "CADRER",
            methodStepId: "method-step-1",
            order: 1,
            ref: "S1",
            scorecardStepId: "scorecard-step-1",
            title: "Cadrer",
            weightPercent: 100,
        }];
        const normalized = normalizeScorecardMethodoEvidence({
            criteres: [criterion({
                points_obtenus: 2,
                preuve: "J'ai encore quelques minutes devant moi.",
                preuve_message_refs: ["M2"],
            })],
        }, transcript);
        const scoreResult = calculateScorecardNotationResult(
            normalized.methodoResult,
            criterionRefs,
            stepRefs,
        );
        const scoreGlobal = buildScoreGlobalFromScorecard(scoreResult);

        expect(scoreResult.criteria[0].pointsAwarded).toBe(0);
        expect(scoreResult.steps[0].scorePercent).toBe(0);
        expect(scoreResult.globalScorePercent).toBe(0);
        expect(scoreGlobal).toMatchObject({
            points_obtenus: 0,
            valeur: 0,
        });
    });

    it("keeps points and rebuilds exact evidence from learner messages in this session", () => {
        const normalized = normalizeScorecardMethodoEvidence({
            criteres: [criterion({
                points_obtenus: 2,
                preuve_message_refs: ["M1", "M3"],
            })],
            onglet: "AnalyseMethodologique",
        }, transcript);

        expect(normalized.warnings).toEqual([]);
        expect(normalized.methodoResult.criteres).toEqual([
            expect.objectContaining({
                points_obtenus: 2,
                preuve: "10:00:01 Apprenant: Quel est votre enjeu prioritaire ? | 10:00:08 Apprenant: Je vous propose de clarifier d'abord votre priorité.",
                preuve_message_refs: ["M1", "M3"],
            }),
        ]);
    });

    it("forces persona-only evidence to zero", () => {
        const normalized = normalizeScorecardMethodoEvidence({
            criteres: [criterion({
                points_obtenus: 2,
                preuve_message_refs: ["M2"],
            })],
        }, transcript);

        expect(normalized.methodoResult.criteres).toEqual([
            expect.objectContaining({
                points_obtenus: 0,
                preuve: SCORECARD_NO_LEARNER_EVIDENCE,
                preuve_message_refs: [],
            }),
        ]);
        expect(normalized.warnings).toEqual(expect.arrayContaining([
            expect.stringContaining("attribuées au Persona (M2)"),
            expect.stringContaining("points ramenés à zéro"),
        ]));
    });

    it("rejects references absent from the current session without comparing quote text", () => {
        const normalized = normalizeScorecardMethodoEvidence({
            criteres: [criterion({
                points_obtenus: 1,
                preuve: transcript.conversation[0].verbatim,
                preuve_message_refs: ["M99"],
            })],
        }, transcript);

        expect(normalized.methodoResult.criteres).toEqual([
            expect.objectContaining({
                points_obtenus: 0,
                preuve: SCORECARD_NO_LEARNER_EVIDENCE,
                preuve_message_refs: [],
            }),
        ]);
    });

    it("discards invalid refs but keeps a score backed by at least one current learner message", () => {
        const normalized = normalizeScorecardMethodoEvidence({
            criteres: [criterion({
                points_obtenus: 1.5,
                preuve_message_refs: ["m1", "M2", "M404", "M1"],
            })],
        }, transcript);

        expect(normalized.methodoResult.criteres).toEqual([
            expect.objectContaining({
                points_obtenus: 1.5,
                preuve: "10:00:01 Apprenant: Quel est votre enjeu prioritaire ?",
                preuve_message_refs: ["M1"],
            }),
        ]);
    });
});
