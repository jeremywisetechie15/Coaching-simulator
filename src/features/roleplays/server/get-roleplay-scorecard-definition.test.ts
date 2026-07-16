import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRoleplayScorecardDefinition } from "./get-roleplay-scorecard-definition";

const rowsByTable: Record<string, Array<Record<string, unknown>>> = {
    scorecards: [{
        category: "Prospection",
        description: "Grille commerciale",
        domain: "Commercial",
        id: "scorecard-1",
        level: "Intermédiaire",
        method_id: "method-1",
        name: "Scorecard test",
    }],
    scorecard_steps: [
        { id: "scorecard-step-1", method_step_id: "method-step-1", name: "Ouverture", scorecard_id: "scorecard-1", step_order: 1, weight_percent: 40 },
        { id: "scorecard-step-2", method_step_id: "method-step-2", name: "Découverte", scorecard_id: "scorecard-1", step_order: 2, weight_percent: 60 },
    ],
    scorecard_criteria: [
        {
            ai_instruction: "Repérer une question ouverte.",
            criterion_key: "question_ouverte",
            criterion_order: 1,
            dimension: "savoir_faire",
            dimension_item_id: "dimension-item-2",
            expected_evidence: "Une question ouverte contextualisée",
            id: "criterion-2",
            max_points: 4,
            scorecard_step_id: "scorecard-step-2",
            skill_id: "skill-2",
            verbatim: "Qu'est-ce qui est prioritaire ?",
        },
    ],
    skill_dimension_items: [{ id: "dimension-item-2", label: "Questionnement ouvert" }],
    skills: [{ id: "skill-2", name: "Découverte du besoin" }],
};

function createFakeSupabase() {
    return {
        from(table: string) {
            const equals = new Map<string, unknown>();
            const included = new Map<string, unknown[]>();
            const query = {
                eq(column: string, value: unknown) {
                    equals.set(column, value);
                    return query;
                },
                in(column: string, values: unknown[]) {
                    included.set(column, values);
                    return query;
                },
                maybeSingle() {
                    const data = filterRows(table, equals, included)[0] ?? null;
                    return Promise.resolve({ data, error: null });
                },
                order() {
                    return query;
                },
                returns() {
                    return Promise.resolve({ data: filterRows(table, equals, included), error: null });
                },
                select() {
                    return query;
                },
            };

            return query;
        },
    } as unknown as SupabaseClient;
}

function filterRows(
    table: string,
    equals: Map<string, unknown>,
    included: Map<string, unknown[]>,
) {
    return (rowsByTable[table] ?? []).filter((row) => (
        [...equals].every(([column, value]) => row[column] === value)
        && [...included].every(([column, values]) => values.includes(row[column]))
    ));
}

describe("getRoleplayScorecardDefinition", () => {
    it("loads only the scorecard criteria linked to the selected method step", async () => {
        const result = await getRoleplayScorecardDefinition(
            createFakeSupabase(),
            "scorecard-1",
            "method-step-2",
        );

        expect(result).toMatchObject({
            category: "Prospection",
            domain: "Commercial",
            name: "Scorecard test",
        });
        expect(result?.steps).toHaveLength(1);
        expect(result?.steps[0]).toMatchObject({
            methodStepId: "method-step-2",
            order: 2,
            title: "Découverte",
            weightPercent: 60,
        });
        expect(result?.steps[0].criteria[0]).toMatchObject({
            dimension: "savoir_faire",
            dimensionItemLabel: "Questionnement ouvert",
            expectedEvidence: "Une question ouverte contextualisée",
            skillName: "Découverte du besoin",
        });
    });
});
