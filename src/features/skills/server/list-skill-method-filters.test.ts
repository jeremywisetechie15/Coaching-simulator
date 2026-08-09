import { beforeEach, describe, expect, it, vi } from "vitest";
import { QUIZ_KIND } from "@/features/evaluations/domain";
import { listSkillMethodFilterData } from "./list-skill-method-filters";

const mocks = vi.hoisted(() => ({
    createClient: vi.fn(),
}));

const eqCalls: Array<{ column: string; table: string; value: string }> = [];

vi.mock("@/lib/supabase/server", () => ({
    createClient: mocks.createClient,
}));

function createSupabaseMock() {
    const rowsByTable = {
        methods: [
            { id: "method-2", name: "Vente conseil" },
            { id: "method-1", name: "Découverte" },
        ],
        quiz_questions: [
            { competence_id: "skill-1", step_id: "quiz-step-1" },
        ],
        quiz_step_competencies: [
            { competence_id: "skill-2", step_id: "quiz-step-1" },
        ],
        quiz_steps: [{ id: "quiz-step-1", quiz_id: "quiz-1" }],
        quizzes: [{ id: "quiz-1", method_id: "method-2" }],
        scorecard_criteria: [
            { scorecard_step_id: "scorecard-step-1", skill_id: "skill-1" },
        ],
        scorecard_steps: [
            { id: "scorecard-step-1", scorecard_id: "scorecard-1" },
        ],
        scorecards: [{ id: "scorecard-1", method_id: "method-1" }],
    };

    const from = vi.fn((table: keyof typeof rowsByTable) => {
        const query: Record<string, ReturnType<typeof vi.fn>> = {};

        query.eq = vi.fn((column: string, value: string) => {
            eqCalls.push({ column, table, value });
            return query;
        });
        query.in = vi.fn(() => query);
        query.order = vi.fn(() => query);
        query.select = vi.fn(() => query);
        query.returns = vi.fn(async () => ({
            data: rowsByTable[table],
            error: null,
        }));

        return query;
    });

    mocks.createClient.mockResolvedValue({ from });
}

beforeEach(() => {
    vi.resetAllMocks();
    eqCalls.length = 0;
    createSupabaseMock();
});

describe("skill method filters", () => {
    it("combines scorecard criteria and main method-quiz associations", async () => {
        const result = await listSkillMethodFilterData(["skill-1", "skill-2"]);

        expect(result).toEqual({
            methodIdsBySkillId: {
                "skill-1": ["method-1", "method-2"],
                "skill-2": ["method-2"],
            },
            methodOptions: [
                { id: "method-1", name: "Découverte" },
                { id: "method-2", name: "Vente conseil" },
            ],
        });
        expect(eqCalls).toContainEqual({
            column: "quiz_kind",
            table: "quizzes",
            value: QUIZ_KIND.methodKnowledge,
        });
    });

    it("does not query Supabase when there are no skills", async () => {
        await expect(listSkillMethodFilterData([])).resolves.toEqual({
            methodIdsBySkillId: {},
            methodOptions: [],
        });

        expect(mocks.createClient).not.toHaveBeenCalled();
    });
});
