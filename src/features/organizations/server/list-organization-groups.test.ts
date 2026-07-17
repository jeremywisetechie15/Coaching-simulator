import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import {
    ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE,
    ORGANIZATION_COUNTED_CONTENT_STATUS,
} from "@/features/organizations/domain/organization-content-scope";
import { ORGANIZATION_GROUP_STATUS } from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { listOrganizationGroups } from "./list-organization-groups";

interface RecordedQuery {
    equals: Array<[string, unknown]>;
    inFilters: Array<[string, unknown[]]>;
    notEquals: Array<[string, unknown]>;
    select?: string;
    table: string;
}

interface QueryResult {
    data: unknown[];
    error: null;
}

function createSupabaseDouble(resolve: (query: RecordedQuery) => QueryResult) {
    const recordedQueries: RecordedQuery[] = [];

    return {
        client: {
            from: vi.fn((table: string) => {
                const recorded: RecordedQuery = {
                    equals: [],
                    inFilters: [],
                    notEquals: [],
                    table,
                };
                const query = {
                    eq: vi.fn((column: string, value: unknown) => {
                        recorded.equals.push([column, value]);
                        return query;
                    }),
                    in: vi.fn((column: string, values: unknown[]) => {
                        recorded.inFilters.push([column, values]);
                        return query;
                    }),
                    neq: vi.fn((column: string, value: unknown) => {
                        recorded.notEquals.push([column, value]);
                        return query;
                    }),
                    order: vi.fn(() => query),
                    returns: vi.fn(async () => {
                        recordedQueries.push(recorded);
                        return resolve(recorded);
                    }),
                    select: vi.fn((select: string) => {
                        recorded.select = select;
                        return query;
                    }),
                };

                return query;
            }),
        },
        recordedQueries,
    };
}

describe("listOrganizationGroups", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("returns active groups with roster members and unique scoped published content", async () => {
        const { client, recordedQueries } = createSupabaseDouble((query) => {
            switch (query.table) {
                case "groups":
                    return {
                        data: [
                            {
                                created_at: "2026-07-01T00:00:00.000Z",
                                description: "Premier groupe",
                                id: "group-1",
                                name: "Alpha",
                                status: ORGANIZATION_GROUP_STATUS.active,
                            },
                            {
                                created_at: "2026-07-02T00:00:00.000Z",
                                description: null,
                                id: "group-2",
                                name: "Beta",
                                status: ORGANIZATION_GROUP_STATUS.active,
                            },
                        ],
                        error: null,
                    };
                case "group_members":
                    return {
                        data: [
                            { group_id: "group-1", user_id: "user-a" },
                            { group_id: "group-1", user_id: "user-a" },
                            { group_id: "group-1", user_id: "removed-user" },
                            { group_id: "group-2", user_id: "user-b" },
                        ],
                        error: null,
                    };
                case "organization_members":
                    return {
                        data: [{ user_id: "user-a" }, { user_id: "user-b" }, { user_id: "user-b" }],
                        error: null,
                    };
                case "scenarios":
                    return {
                        data: [
                            { group_id: "group-1", id: "scenario-1" },
                            { group_id: "group-1", id: "scenario-1" },
                            { group_id: "group-1", id: "scenario-2" },
                            { group_id: "group-2", id: "scenario-3" },
                        ],
                        error: null,
                    };
                case "quizzes":
                    return {
                        data: [
                            { group_id: "group-1", id: "quiz-1" },
                            { group_id: "group-1", id: "quiz-1" },
                            { group_id: "group-2", id: "quiz-2" },
                            { group_id: "group-2", id: "quiz-3" },
                        ],
                        error: null,
                    };
                default:
                    throw new Error(`Unexpected query for ${query.table}`);
            }
        });
        mocks.createAdminClient.mockReturnValue(client);

        await expect(listOrganizationGroups("organization-1")).resolves.toEqual([
            {
                createdAt: "1 juillet 2026",
                description: "Premier groupe",
                id: "group-1",
                memberCount: 1,
                name: "Alpha",
                quizCount: 1,
                roleplayCount: 2,
                status: ORGANIZATION_GROUP_STATUS.active,
            },
            {
                createdAt: "2 juillet 2026",
                description: "",
                id: "group-2",
                memberCount: 1,
                name: "Beta",
                quizCount: 2,
                roleplayCount: 1,
                status: ORGANIZATION_GROUP_STATUS.active,
            },
        ]);

        const groupsQuery = recordedQueries.find((query) => query.table === "groups");
        const membershipQuery = recordedQueries.find((query) => query.table === "organization_members");
        expect(groupsQuery?.equals).toContainEqual(["status", ORGANIZATION_GROUP_STATUS.active]);
        expect(membershipQuery?.notEquals).toContainEqual(["status", ORGANIZATION_MEMBER_STATUS.removed]);

        for (const table of ["scenarios", "quizzes"]) {
            const contentQuery = recordedQueries.find((query) => query.table === table);
            expect(contentQuery?.select).toBe("id, group_id");
            expect(contentQuery?.equals).toContainEqual(["visibility_scope", CONTENT_VISIBILITY_SCOPE.group]);
            expect(contentQuery?.equals).toContainEqual(["status", ORGANIZATION_COUNTED_CONTENT_STATUS]);
            expect(contentQuery?.equals).toContainEqual(["is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE]);
        }
    });

    it("does not query counters when the organization has no active group", async () => {
        const { client, recordedQueries } = createSupabaseDouble((query) => {
            if (query.table !== "groups") {
                throw new Error(`Unexpected query for ${query.table}`);
            }

            return { data: [], error: null };
        });
        mocks.createAdminClient.mockReturnValue(client);

        await expect(listOrganizationGroups("organization-1")).resolves.toEqual([]);
        expect(recordedQueries.map((query) => query.table)).toEqual(["groups"]);
    });
});
