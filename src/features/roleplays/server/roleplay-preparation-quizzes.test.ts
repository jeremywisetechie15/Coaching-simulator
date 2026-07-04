import { describe, expect, it } from "vitest";
import { mergeMethodKnowledgeQuizRow } from "./roleplay-preparation-quizzes";

describe("mergeMethodKnowledgeQuizRow", () => {
    it("prepends the method knowledge quiz before contextual scenario quizzes", () => {
        expect(
            mergeMethodKnowledgeQuizRow({
                methodQuizId: "method-quiz",
                scenarioId: "scenario-1",
                scenarioQuizRows: [
                    {
                        participation: "optional",
                        quiz_id: "contextual-quiz",
                        scenario_id: "scenario-1",
                        sort_order: 1,
                    },
                ],
            }).map((row) => row.quiz_id),
        ).toEqual(["method-quiz", "contextual-quiz"]);
    });

    it("deduplicates the method knowledge quiz if it was also stored as a scenario quiz", () => {
        const rows = mergeMethodKnowledgeQuizRow({
            methodQuizId: "method-quiz",
            scenarioId: "scenario-1",
            scenarioQuizRows: [
                {
                    participation: "optional",
                    quiz_id: "method-quiz",
                    scenario_id: "scenario-1",
                    sort_order: 1,
                },
                {
                    participation: "optional",
                    quiz_id: "contextual-quiz",
                    scenario_id: "scenario-1",
                    sort_order: 2,
                },
            ],
        });

        expect(rows).toHaveLength(2);
        expect(rows.map((row) => row.quiz_id)).toEqual(["method-quiz", "contextual-quiz"]);
        expect(rows[0]).toMatchObject({
            participation: "mandatory",
            scenario_id: "scenario-1",
            sort_order: 0,
        });
    });

    it("keeps scenario quizzes unchanged when the method has no knowledge quiz", () => {
        const scenarioQuizRows = [
            {
                participation: "optional",
                quiz_id: "contextual-quiz",
                scenario_id: "scenario-1",
                sort_order: 1,
            },
        ] as const;

        expect(
            mergeMethodKnowledgeQuizRow({
                methodQuizId: null,
                scenarioId: "scenario-1",
                scenarioQuizRows: [...scenarioQuizRows],
            }),
        ).toEqual(scenarioQuizRows);
    });
});
