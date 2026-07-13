import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoleplayNotationScoreResult } from "@/features/roleplays/domain";
import type { RoleplayScorecardNotationContext } from "./build-roleplay-notation-context";
import { persistRoleplayScorecardNotationResults } from "./persist-roleplay-notation-results";

function createFakeSupabase() {
    const calls: Array<{ method: string; options?: unknown; payload?: unknown; table: string }> = [];

    const supabase = {
        from(table: string) {
            return {
                delete() {
                    calls.push({ method: "delete", table });
                    return {
                        eq(column: string, value: string) {
                            calls.push({ method: "eq", payload: { column, value }, table });
                            return Promise.resolve({ error: null });
                        },
                    };
                },
                insert(payload: unknown) {
                    calls.push({ method: "insert", payload, table });
                    return Promise.resolve({ error: null });
                },
                upsert(payload: unknown, options?: unknown) {
                    calls.push({ method: "upsert", options, payload, table });
                    return Promise.resolve({ error: null });
                },
            };
        },
    } as unknown as SupabaseClient;

    return { calls, supabase };
}

const context = {
    criterionRefs: [
        {
            criterionKey: "Identifier le besoin",
            dimension: "savoir_faire",
            dimensionItemId: "dimension-item-1",
            dimensionItemLabel: "Questionnement",
            expectedEvidence: "Le besoin est explicité.",
            maxPoints: 4,
            methodStepId: "method-step-1",
            ref: "C1",
            scorecardCriterionId: "criterion-1",
            scorecardStepId: "scorecard-step-1",
            skillId: "decouverte",
            skillName: "Découverte",
            stepOrder: 1,
            stepRef: "S1",
            stepTitle: "Découvrir",
            verbatim: "Quel est votre enjeu ?",
        },
    ],
    method: {
        category: "Vente",
        challenges: [],
        code: "dago",
        description: "",
        domain: "Commercial",
        id: "method-1",
        name: "DAGO",
        objectives: [],
        steps: [],
        version: "v1",
    },
    scenario: {
        coachingSteps: "",
        category: "Prospection",
        context: "",
        description: "",
        difficulty: "Moyen",
        discProfile: "Stable",
        domain: "Commercial",
        id: "scenario-1",
        objective: "",
        obstacles: "",
        title: "Roleplay",
    },
    scorecard: {
        category: "Prospection",
        description: "",
        domain: "Commercial",
        id: "scorecard-1",
        level: "Intermédiaire",
        name: "Scorecard",
        steps: [],
    },
    persona: null,
    session: {
        completedAt: "2026-07-02T10:00:00.000Z",
        durationSeconds: 120,
        id: "session-1",
        scenarioId: "scenario-1",
        userId: "user-1",
    },
    stepRefs: [{
        code: "D",
        methodStepId: "method-step-1",
        order: 1,
        ref: "S1",
        scorecardStepId: "scorecard-step-1",
        title: "Découvrir",
    }],
    transcript: "",
    transcription: {
        conversation: [],
        exclude_from_global_score: true,
        messages_apprenant: 0,
        messages_persona: 0,
        onglet: "Transcription",
        total_messages: 0,
    },
} satisfies RoleplayScorecardNotationContext;

const scoreResult = {
    criteria: [
        {
            advice: "Reformuler avant de conclure.",
            coachComment: "Bonne question ouverte.",
            evidence: "Question posée.",
            pointsAwarded: 3,
            pointsMax: 4,
            ref: "C1",
            scorePercent: 75,
        },
    ],
    globalScorePercent: 75,
    pointsAwarded: 3,
    pointsMax: 4,
    steps: [
        {
            coachComment: "Étape correcte.",
            criteria: [],
            methodStepId: "method-step-1",
            pointsAwarded: 3,
            pointsMax: 4,
            scorePercent: 75,
            scorecardStepId: "scorecard-step-1",
            stepOrder: 1,
            title: "Découvrir",
        },
    ],
} satisfies RoleplayNotationScoreResult;

describe("persistRoleplayScorecardNotationResults", () => {
    it("replaces normalized rows and maps criterion refs to DB ids", async () => {
        const { calls, supabase } = createFakeSupabase();

        await persistRoleplayScorecardNotationResults(supabase, context, scoreResult);

        expect(calls.filter((call) => call.method === "delete").map((call) => call.table)).toEqual([
            "roleplay_session_criterion_results",
            "roleplay_session_step_results",
        ]);
        expect(calls.find((call) => call.method === "upsert")).toMatchObject({
            table: "roleplay_session_results",
            payload: {
                method_id: "method-1",
                notation_source: "scorecard",
                points_awarded: 3,
                points_max: 4,
                scenario_id: "scenario-1",
                score_percent: 75,
                scorecard_id: "scorecard-1",
                session_id: "session-1",
                user_id: "user-1",
            },
        });
        expect(calls.find((call) => call.method === "insert" && call.table === "roleplay_session_criterion_results"))
            .toMatchObject({
                payload: [
                    {
                        criterion_ref: "C1",
                        dimension: "savoir_faire",
                        dimension_item_id: "dimension-item-1",
                        scorecard_criterion_id: "criterion-1",
                        skill_id: "decouverte",
                    },
                ],
            });
    });
});
