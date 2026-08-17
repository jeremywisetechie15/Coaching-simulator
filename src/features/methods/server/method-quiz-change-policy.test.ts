import { describe, expect, it } from "vitest";
import {
    METHOD_QUIZ_HISTORICAL_IMPACT_CONFIRMATION_REQUIRED_CODE,
    METHOD_QUIZ_ROLEPLAY_LINK_CONFLICT_MESSAGE,
} from "@/features/methods/domain/method";
import { assertMethodQuizChangePolicy } from "./method-quiz-change-policy";

type FakeRow = Record<string, unknown>;

class FakeQuery implements PromiseLike<{
    count: number | null;
    data: FakeRow[] | null;
    error: null;
}> {
    private countOnly = false;
    private readonly filters: Array<(row: FakeRow) => boolean> = [];

    constructor(private readonly rows: FakeRow[]) {}

    select(_columns: string, options?: { head?: boolean }) {
        this.countOnly = options?.head === true;
        return this;
    }

    eq(column: string, value: unknown) {
        this.filters.push((row) => row[column] === value);
        return this;
    }

    in(column: string, values: unknown[]) {
        this.filters.push((row) => values.includes(row[column]));
        return this;
    }

    neq(column: string, value: unknown) {
        this.filters.push((row) => row[column] !== value);
        return this;
    }

    maybeSingle() {
        return Promise.resolve({
            count: null,
            data: this.filteredRows()[0] ?? null,
            error: null,
        });
    }

    then<TResult1 = {
        count: number | null;
        data: FakeRow[] | null;
        error: null;
    }, TResult2 = never>(
        onfulfilled?: ((value: {
            count: number | null;
            data: FakeRow[] | null;
            error: null;
        }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        const rows = this.filteredRows();
        return Promise.resolve({
            count: this.countOnly ? rows.length : null,
            data: this.countOnly ? null : rows,
            error: null,
        } as const).then(onfulfilled, onrejected);
    }

    private filteredRows() {
        return this.rows.filter((row) => this.filters.every((filter) => filter(row)));
    }
}

function createFakeSupabase({
    attemptQuizIds = [],
    currentQuizId = null,
    roleplayQuizIds = [],
}: {
    attemptQuizIds?: string[];
    currentQuizId?: string | null;
    roleplayQuizIds?: string[];
} = {}) {
    const rowsByTable: Record<string, FakeRow[]> = {
        quiz_attempts: attemptQuizIds.map((quizId, index) => ({
            id: `attempt-${index + 1}`,
            quiz_id: quizId,
        })),
        quizzes: currentQuizId
            ? [{
                  id: currentQuizId,
                  is_active: true,
                  method_id: "method-1",
                  quiz_kind: "method_knowledge",
                  status: "published",
              }]
            : [],
        scenario_quizzes: roleplayQuizIds.map((quizId, index) => ({
            quiz_id: quizId,
            scenario_id: `scenario-${index + 1}`,
        })),
    };

    return {
        from(table: string) {
            return new FakeQuery(rowsByTable[table] ?? []);
        },
    };
}

describe("method principal quiz change policy", () => {
    it("does nothing when the principal quiz association is unchanged", async () => {
        await expect(assertMethodQuizChangePolicy(
            createFakeSupabase({ currentQuizId: "quiz-current" }) as never,
            {
                hasExistingUsage: true,
                methodId: "method-1",
                nextQuizId: "quiz-current",
            },
        )).resolves.toBeUndefined();
    });

    it("rejects promotion while the quiz is complementary in a roleplay", async () => {
        await expect(assertMethodQuizChangePolicy(
            createFakeSupabase({ roleplayQuizIds: ["quiz-next"] }) as never,
            {
                hasExistingUsage: false,
                methodId: "method-1",
                nextQuizId: "quiz-next",
            },
        )).rejects.toMatchObject({
            message: METHOD_QUIZ_ROLEPLAY_LINK_CONFLICT_MESSAGE,
            status: 409,
        });
    });

    it("requires confirmation when the selected quiz already has attempts", async () => {
        await expect(assertMethodQuizChangePolicy(
            createFakeSupabase({ attemptQuizIds: ["quiz-next"] }) as never,
            {
                hasExistingUsage: false,
                methodId: "method-1",
                nextQuizId: "quiz-next",
            },
        )).rejects.toMatchObject({
            code: METHOD_QUIZ_HISTORICAL_IMPACT_CONFIRMATION_REQUIRED_CODE,
            status: 409,
        });
    });

    it("requires confirmation when the method already has usage", async () => {
        await expect(assertMethodQuizChangePolicy(
            createFakeSupabase() as never,
            {
                hasExistingUsage: true,
                methodId: "method-1",
                nextQuizId: "quiz-next",
            },
        )).rejects.toMatchObject({
            code: METHOD_QUIZ_HISTORICAL_IMPACT_CONFIRMATION_REQUIRED_CODE,
            status: 409,
        });
    });

    it("allows the historical change after explicit confirmation", async () => {
        await expect(assertMethodQuizChangePolicy(
            createFakeSupabase({ attemptQuizIds: ["quiz-next"] }) as never,
            {
                hasExistingUsage: false,
                historicalImpactConfirmed: true,
                methodId: "method-1",
                nextQuizId: "quiz-next",
            },
        )).resolves.toBeUndefined();
    });
});
