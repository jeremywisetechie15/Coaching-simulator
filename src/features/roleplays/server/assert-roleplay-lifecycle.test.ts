import { describe, expect, it } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import type { SaveRoleplayDto } from "@/features/roleplays/dto";
import { assertRoleplayLifecycle } from "./assert-roleplay-lifecycle";

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

function createFakeSupabase(rowsByTable: Record<string, FakeRow[]>) {
    return {
        from(table: string) {
            return new FakeQuery(rowsByTable[table] ?? []);
        },
    };
}

describe("assertRoleplayLifecycle", () => {
    it.each([CONTENT_STATUS.draft, CONTENT_STATUS.archived])(
        "allows a published roleplay to reference %s content",
        async (dependencyStatus) => {
            const supabase = createFakeSupabase({
                methods: [{
                    id: "method-1",
                    organization_id: null,
                    scope: CONTENT_VISIBILITY_SCOPE.public,
                    status: dependencyStatus,
                }],
            });
            const input = {
                methodId: "method-1",
                quizIds: [],
                scorecardId: null,
                scope: CONTENT_VISIBILITY_SCOPE.public,
                status: CONTENT_STATUS.published,
            } as unknown as SaveRoleplayDto;

            await expect(assertRoleplayLifecycle(supabase as never, input)).resolves.toBeUndefined();
        },
    );
});
