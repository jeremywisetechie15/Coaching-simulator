import { describe, expect, it } from "vitest";
import {
    CONTENT_STATUS,
    CONTENT_VISIBILITY_SCOPE,
} from "@/features/content/domain";
import {
    assertContentDependencyScopes,
    assertContentStatusTransition,
    assertInitialContentStatus,
    CONTENT_DEPENDENCY_KIND,
} from "./content-lifecycle";

type FakeRow = Record<string, unknown>;

class FakeQuery {
    private readonly filters: Array<(row: FakeRow) => boolean> = [];

    constructor(private readonly rows: FakeRow[]) {}

    select() {
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

    then<TResult1 = { data: FakeRow[]; error: null }>(
        onfulfilled?: ((value: { data: FakeRow[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    ) {
        return Promise.resolve({ data: this.filteredRows(), error: null }).then(onfulfilled);
    }

    private filteredRows() {
        return this.rows.filter((row) => this.filters.every((filter) => filter(row)));
    }
}

function createFakeSupabase(rowsByTable: Record<string, FakeRow[]>) {
    return {
        from(table: string) {
            return new FakeQuery(rowsByTable[table] ?? []);
        },
    };
}

describe("content lifecycle server guards", () => {
    it("rejects missing dependencies even for a draft parent", async () => {
        await expect(assertContentDependencyScopes(
            createFakeSupabase({}) as never,
            CONTENT_STATUS.draft,
            [{ id: "method-missing", kind: CONTENT_DEPENDENCY_KIND.method }],
            { scope: CONTENT_VISIBILITY_SCOPE.public },
        )).rejects.toMatchObject({
            message: expect.stringContaining("introuvable"),
            status: 409,
        });
    });

    it("rejects a published parent that exposes a narrower dependency", async () => {
        const supabase = createFakeSupabase({
            quizzes: [{
                assigned_user_id: "user-1",
                id: "quiz-1",
                is_active: true,
                status: CONTENT_STATUS.published,
                visibility_scope: CONTENT_VISIBILITY_SCOPE.user,
            }],
        });

        await expect(assertContentDependencyScopes(
            supabase as never,
            CONTENT_STATUS.published,
            [{ id: "quiz-1", kind: CONTENT_DEPENDENCY_KIND.quiz }],
            { scope: CONTENT_VISIBILITY_SCOPE.public },
        )).rejects.toMatchObject({
            message:
                "Impossible de publier : le quiz associé n'est pas accessible à tous les destinataires prévus. " +
                "Vérifiez que sa visibilité correspond à celle du contenu.",
            status: 409,
        });
    });

    it.each([
        {
            id: "coach-1",
            kind: CONTENT_DEPENDENCY_KIND.coach,
            table: "coaches",
        },
        {
            id: "persona-1",
            kind: CONTENT_DEPENDENCY_KIND.persona,
            table: "personas",
        },
    ])("treats a published $kind without audience columns as globally available", async ({ id, kind, table }) => {
        const supabase = createFakeSupabase({
            [table]: [{
                id,
                status: CONTENT_STATUS.published,
            }],
        });

        await expect(assertContentDependencyScopes(
            supabase as never,
            CONTENT_STATUS.published,
            [{ id, kind }],
            { scope: CONTENT_VISIBILITY_SCOPE.public },
        )).resolves.toBeUndefined();
    });

    it("uses active memberships for a user-scoped parent", async () => {
        const supabase = createFakeSupabase({
            group_members: [],
            methods: [{
                id: "method-1",
                is_active: true,
                organization_id: "org-1",
                scope: CONTENT_VISIBILITY_SCOPE.organization,
                status: CONTENT_STATUS.published,
            }],
            organization_members: [{
                organization_id: "org-1",
                status: "active",
                user_id: "user-1",
            }],
        });

        await expect(assertContentDependencyScopes(
            supabase as never,
            CONTENT_STATUS.published,
            [{ id: "method-1", kind: CONTENT_DEPENDENCY_KIND.method }],
            { scope: CONTENT_VISIBILITY_SCOPE.user, userId: "user-1" },
        )).resolves.toBeUndefined();
    });

    it("rejects a missing scoped dependency", async () => {
        await expect(assertContentDependencyScopes(
            createFakeSupabase({}) as never,
            CONTENT_STATUS.published,
            [{ id: "method-missing", kind: CONTENT_DEPENDENCY_KIND.method }],
            { scope: CONTENT_VISIBILITY_SCOPE.public },
        )).rejects.toMatchObject({ status: 409 });
    });

    it("allows archival regardless of published dependants", () => {
        expect(() => assertContentStatusTransition(
            CONTENT_STATUS.published,
            CONTENT_STATUS.archived,
        )).not.toThrow();
        expect(() => assertContentStatusTransition(
            CONTENT_STATUS.draft,
            CONTENT_STATUS.archived,
        )).not.toThrow();
    });

    it("rejects published-to-draft and restoration transitions", () => {
        expect(() => assertContentStatusTransition(
            CONTENT_STATUS.published,
            CONTENT_STATUS.draft,
        )).toThrowError();
        expect(() => assertContentStatusTransition(
            CONTENT_STATUS.archived,
            CONTENT_STATUS.published,
        )).toThrowError();
    });

    it("rejects direct creation as archived", () => {
        expect(() => assertInitialContentStatus(CONTENT_STATUS.archived)).toThrowError();
    });
});
