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
    it("does not inspect dependency statuses for a draft parent", async () => {
        await expect(assertContentDependencyScopes(
            createFakeSupabase({}) as never,
            CONTENT_STATUS.draft,
            [{ id: "method-missing", kind: CONTENT_DEPENDENCY_KIND.method }],
            { scope: CONTENT_VISIBILITY_SCOPE.public },
        )).resolves.toBeUndefined();
    });

    it("rejects a published parent that exposes a narrower dependency", async () => {
        const supabase = createFakeSupabase({
            methods: [{
                id: "method-1",
                organization_id: "org-1",
                scope: CONTENT_VISIBILITY_SCOPE.organization,
            }],
        });

        await expect(assertContentDependencyScopes(
            supabase as never,
            CONTENT_STATUS.published,
            [{ id: "method-1", kind: CONTENT_DEPENDENCY_KIND.method }],
            { scope: CONTENT_VISIBILITY_SCOPE.public },
        )).rejects.toMatchObject({
            message: expect.stringContaining("portée"),
            status: 409,
        });
    });

    it("uses active memberships for a user-scoped parent", async () => {
        const supabase = createFakeSupabase({
            group_members: [],
            methods: [{
                id: "method-1",
                organization_id: "org-1",
                scope: CONTENT_VISIBILITY_SCOPE.organization,
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
