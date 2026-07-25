import { describe, expect, it } from "vitest";
import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { ORGANIZATION_GROUP_STATUS } from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { assertActiveContentTarget } from "./content-target-validation";

type FakeRow = Record<string, unknown>;

class FakeQuery implements PromiseLike<{ data: FakeRow | null; error: null }> {
    private readonly filters: Array<(row: FakeRow) => boolean> = [];

    constructor(private readonly rows: FakeRow[]) {}

    select() {
        return this;
    }

    eq(column: string, value: unknown) {
        this.filters.push((row) => row[column] === value);
        return this;
    }

    maybeSingle() {
        return this;
    }

    then<TResult1 = { data: FakeRow | null; error: null }, TResult2 = never>(
        onfulfilled?: ((value: { data: FakeRow | null; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): PromiseLike<TResult1 | TResult2> {
        const data = this.rows.find((row) => this.filters.every((filter) => filter(row))) ?? null;
        return Promise.resolve({ data, error: null } as const).then(onfulfilled, onrejected);
    }
}

function createFakeSupabase(rowsByTable: Record<string, FakeRow[]>) {
    return {
        from(table: string) {
            return new FakeQuery(rowsByTable[table] ?? []);
        },
    };
}

describe("active content target validation", () => {
    it("rejects a suspended organization", async () => {
        const supabase = createFakeSupabase({
            organizations: [{ id: "org-1", status: ORGANIZATION_STATUS.suspended }],
        });

        await expect(assertActiveContentTarget(supabase as never, {
            organizationId: "org-1",
            scope: CONTENT_VISIBILITY_SCOPE.organization,
        })).rejects.toThrow("désactivée");
    });

    it("accepts an active user membership in an active group", async () => {
        const supabase = createFakeSupabase({
            group_members: [{ group_id: "group-1", user_id: "user-1" }],
            groups: [{
                id: "group-1",
                organization_id: "org-1",
                status: ORGANIZATION_GROUP_STATUS.active,
            }],
            organization_members: [{
                organization_id: "org-1",
                status: ORGANIZATION_MEMBER_STATUS.active,
                user_id: "user-1",
            }],
            organizations: [{ id: "org-1", status: ORGANIZATION_STATUS.active }],
        });

        await expect(assertActiveContentTarget(supabase as never, {
            groupId: "group-1",
            organizationId: "org-1",
            scope: CONTENT_VISIBILITY_SCOPE.user,
            userId: "user-1",
        })).resolves.toBeUndefined();
    });
});
