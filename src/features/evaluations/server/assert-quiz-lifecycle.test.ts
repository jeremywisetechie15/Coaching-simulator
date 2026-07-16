import { describe, expect, it } from "vitest";
import { assertQuizKnowledgeSkills } from "./assert-quiz-lifecycle";

type FakeRow = Record<string, unknown>;

class FakeQuery implements PromiseLike<{ data: FakeRow[]; error: null }> {
    private readonly filters: Array<(row: FakeRow) => boolean> = [];

    constructor(private readonly rows: FakeRow[]) {}

    select() {
        return this;
    }

    in(column: string, values: unknown[]) {
        this.filters.push((row) => values.includes(row[column]));
        return this;
    }

    eq(column: string, value: unknown) {
        this.filters.push((row) => row[column] === value);
        return this;
    }

    returns<T>() {
        return this as unknown as PromiseLike<{ data: T; error: null }>;
    }

    then<TResult1 = { data: FakeRow[]; error: null }, TResult2 = never>(
        onfulfilled?: ((value: { data: FakeRow[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        return Promise.resolve({
            data: this.rows.filter((row) => this.filters.every((filter) => filter(row))),
            error: null,
        } as const).then(onfulfilled, onrejected);
    }
}

function createFakeSupabase(rows: FakeRow[]) {
    return {
        from() {
            return new FakeQuery(rows);
        },
    };
}

describe("assertQuizKnowledgeSkills", () => {
    it("accepts skills with an active savoir item", async () => {
        const supabase = createFakeSupabase([
            { dimension: "savoir", is_active: true, skill_id: "skill-1" },
        ]);

        await expect(assertQuizKnowledgeSkills(supabase as never, ["skill-1"]))
            .resolves.toBeUndefined();
    });

    it("rejects skills without an active savoir item", async () => {
        const supabase = createFakeSupabase([
            { dimension: "savoir_faire", is_active: true, skill_id: "skill-1" },
        ]);

        await expect(assertQuizKnowledgeSkills(supabase as never, ["skill-1"]))
            .rejects.toThrow("Chaque compétence d'un quiz doit posséder au moins un item Savoir actif.");
    });
});
