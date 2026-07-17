import { describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { listOrganizationContentScope } from "./list-organization-content-scope";

type DataRow = Record<string, unknown>;

function createInMemoryClient(tables: Record<string, DataRow[]>) {
    const from = vi.fn((table: string) => {
        const filters: Array<(row: DataRow) => boolean> = [];
        const query = {
            eq(column: string, value: unknown) {
                filters.push((row) => row[column] === value);
                return query;
            },
            in(column: string, values: unknown[]) {
                filters.push((row) => values.includes(row[column]));
                return query;
            },
            returns() {
                return query;
            },
            select() {
                return query;
            },
            then<TResult1 = unknown, TResult2 = never>(
                onFulfilled?: ((value: { data: DataRow[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
                onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
            ) {
                const data = (tables[table] ?? []).filter((row) => filters.every((filter) => filter(row)));
                return Promise.resolve({ data, error: null }).then(onFulfilled, onRejected);
            },
        };

        return query;
    });

    return { from };
}

function contentRow({
    id,
    scope,
    ...overrides
}: {
    id: string;
    scope: string;
} & DataRow): DataRow {
    return {
        assigned_user_id: null,
        group_id: null,
        id,
        is_active: true,
        organization_id: null,
        status: CONTENT_STATUS.published,
        visibility_scope: scope,
        ...overrides,
    };
}

describe("listOrganizationContentScope", () => {
    it("loads all organizations in batches and includes quizzes derived from explicit roleplays", async () => {
        const client = createInMemoryClient({
            groups: [
                { id: "group-active", organization_id: "organization-a", status: "active" },
                { id: "group-archived", organization_id: "organization-a", status: "archived" },
            ],
            group_members: [
                { group_id: "group-active", user_id: "user-a" },
                { group_id: "group-active", user_id: "user-b" },
            ],
            organization_members: [
                { organization_id: "organization-a", status: ORGANIZATION_MEMBER_STATUS.active, user_id: "user-a" },
                { organization_id: "organization-a", status: ORGANIZATION_MEMBER_STATUS.invited, user_id: "user-b" },
                { organization_id: "organization-a", status: ORGANIZATION_MEMBER_STATUS.removed, user_id: "user-removed" },
            ],
            quiz_user_assignments: [
                { quiz_id: "quiz-explicit", user_id: "user-b" },
                { quiz_id: "quiz-public-for-removed", user_id: "user-removed" },
            ],
            quizzes: [
                contentRow({
                    id: "quiz-organization",
                    organization_id: "organization-a",
                    scope: CONTENT_VISIBILITY_SCOPE.organization,
                }),
                contentRow({ id: "quiz-explicit", scope: CONTENT_VISIBILITY_SCOPE.public }),
                contentRow({ id: "quiz-linked", scope: CONTENT_VISIBILITY_SCOPE.public }),
                contentRow({
                    id: "quiz-method",
                    method_id: "method-a",
                    quiz_kind: "method_knowledge",
                    scope: CONTENT_VISIBILITY_SCOPE.public,
                }),
                contentRow({ id: "quiz-public-global", scope: CONTENT_VISIBILITY_SCOPE.public }),
            ],
            scenario_quizzes: [
                { quiz_id: "quiz-linked", scenario_id: "roleplay-explicit" },
            ],
            scenario_user_assignments: [
                {
                    assigned_at: "2026-07-17T08:00:00.000Z",
                    scenario_id: "roleplay-explicit",
                    user_id: "user-a",
                },
            ],
            scenarios: [
                contentRow({
                    id: "roleplay-organization",
                    method_id: null,
                    organization_id: "organization-a",
                    scope: CONTENT_VISIBILITY_SCOPE.organization,
                }),
                contentRow({
                    group_id: "group-active",
                    id: "roleplay-group",
                    method_id: null,
                    organization_id: "organization-a",
                    scope: CONTENT_VISIBILITY_SCOPE.group,
                }),
                contentRow({
                    group_id: "group-archived",
                    id: "roleplay-archived-group",
                    method_id: null,
                    organization_id: "organization-a",
                    scope: CONTENT_VISIBILITY_SCOPE.group,
                }),
                contentRow({
                    id: "roleplay-explicit",
                    method_id: "method-a",
                    scope: CONTENT_VISIBILITY_SCOPE.public,
                }),
                contentRow({
                    id: "roleplay-draft",
                    method_id: null,
                    organization_id: "organization-a",
                    scope: CONTENT_VISIBILITY_SCOPE.organization,
                    status: CONTENT_STATUS.draft,
                }),
                contentRow({ id: "roleplay-public-global", method_id: null, scope: CONTENT_VISIBILITY_SCOPE.public }),
            ],
        });

        const snapshot = await listOrganizationContentScope(client as never, ["organization-a"]);

        expect(snapshot.countsByOrganizationId.get("organization-a")).toEqual({
            groupCount: 1,
            quizCount: 4,
            roleplayCount: 3,
            userCount: 2,
        });
        expect(Array.from(snapshot.quizIdsByOrganizationId.get("organization-a") ?? []).sort()).toEqual([
            "quiz-explicit",
            "quiz-linked",
            "quiz-method",
            "quiz-organization",
        ]);
        expect(snapshot.roleplayIdsByOrganizationUserId.get("organization-a")?.get("user-a")?.size).toBe(3);
        expect(snapshot.roleplayIdsByGroupUserId.get("group-active")?.get("user-b")?.size).toBe(1);
    });
});
