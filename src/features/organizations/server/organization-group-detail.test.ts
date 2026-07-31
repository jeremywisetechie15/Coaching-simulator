import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import {
    ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE,
    ORGANIZATION_COUNTED_CONTENT_STATUS,
} from "@/features/organizations/domain/organization-content-scope";
import { ORGANIZATION_GROUP_STATUS } from "@/features/organizations/domain/organization-detail";
import {
    ORGANIZATION_MEMBER_ROLE,
    ORGANIZATION_MEMBER_STATUS,
} from "@/features/organizations/domain/organization-member";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    listOrganizationUserAssignmentCounts: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("./list-organization-user-assignment-counts", () => ({
    listOrganizationUserAssignmentCounts: mocks.listOrganizationUserAssignmentCounts,
}));

import { getOrganizationGroupPageData } from "./organization-group-detail";

interface RecordedQuery {
    equals: Array<[string, unknown]>;
    greaterThanOrEquals: Array<[string, unknown]>;
    inFilters: Array<[string, unknown[]]>;
    notEquals: Array<[string, unknown]>;
    select?: string;
    table: string;
}

interface QueryResult {
    data: unknown;
    error: null;
}

function createSupabaseDouble(resolve: (query: RecordedQuery) => QueryResult) {
    const recordedQueries: RecordedQuery[] = [];

    return {
        client: {
            from: vi.fn((table: string) => {
                const recorded: RecordedQuery = {
                    equals: [],
                    greaterThanOrEquals: [],
                    inFilters: [],
                    notEquals: [],
                    table,
                };
                const complete = async () => {
                    recordedQueries.push(recorded);
                    return resolve(recorded);
                };
                const query = {
                    eq: vi.fn((column: string, value: unknown) => {
                        recorded.equals.push([column, value]);
                        return query;
                    }),
                    gte: vi.fn((column: string, value: unknown) => {
                        recorded.greaterThanOrEquals.push([column, value]);
                        return query;
                    }),
                    in: vi.fn((column: string, values: unknown[]) => {
                        recorded.inFilters.push([column, values]);
                        return query;
                    }),
                    maybeSingle: vi.fn(complete),
                    neq: vi.fn((column: string, value: unknown) => {
                        recorded.notEquals.push([column, value]);
                        return query;
                    }),
                    order: vi.fn(() => query),
                    returns: vi.fn(complete),
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

function hasSelect(query: RecordedQuery, select: string) {
    return query.select === select;
}

describe("organization group detail data", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
        mocks.listOrganizationUserAssignmentCounts.mockResolvedValue(new Map([
            ["member-a", { quizCount: 2, roleplayCount: 3 }],
            ["member-b", { quizCount: 1, roleplayCount: 1 }],
            ["member-invited", { quizCount: 1, roleplayCount: 1 }],
        ]));
    });

    it("hydrates every tab from the selected group and reserves activities for active learners", async () => {
        const { client, recordedQueries } = createSupabaseDouble((query) => {
            if (query.table === "organizations") {
                return {
                    data: {
                        id: "organization-1",
                        name: "Deepmark",
                        status: ORGANIZATION_STATUS.active,
                    },
                    error: null,
                };
            }

            if (query.table === "groups") {
                return {
                    data: {
                        created_at: "2026-07-18T00:00:00.000Z",
                        description: "Équipe commerciale France",
                        id: "group-1",
                        name: "Sales",
                        organization_id: "organization-1",
                        status: ORGANIZATION_GROUP_STATUS.active,
                    },
                    error: null,
                };
            }

            if (query.table === "group_members") {
                return {
                    data: [
                        { assigned_at: "2026-07-01T00:00:00.000Z", user_id: "member-a" },
                        { assigned_at: "2026-07-02T00:00:00.000Z", user_id: "member-b" },
                        { assigned_at: "2026-07-03T00:00:00.000Z", user_id: "member-invited" },
                        { assigned_at: "2026-07-04T00:00:00.000Z", user_id: "member-removed" },
                    ],
                    error: null,
                };
            }

            if (
                query.table === "organization_members"
                && hasSelect(query, "user_id, status")
            ) {
                return {
                    data: [
                        { status: ORGANIZATION_MEMBER_STATUS.active, user_id: "member-a" },
                        { status: ORGANIZATION_MEMBER_STATUS.active, user_id: "member-b" },
                        { status: ORGANIZATION_MEMBER_STATUS.invited, user_id: "member-invited" },
                    ],
                    error: null,
                };
            }

            if (
                query.table === "organization_members"
                && hasSelect(query, "user_id, role, status")
            ) {
                return {
                    data: [
                        {
                            role: ORGANIZATION_MEMBER_ROLE.member,
                            status: ORGANIZATION_MEMBER_STATUS.active,
                            user_id: "member-a",
                        },
                        {
                            role: ORGANIZATION_MEMBER_ROLE.manager,
                            status: ORGANIZATION_MEMBER_STATUS.active,
                            user_id: "member-b",
                        },
                        {
                            role: ORGANIZATION_MEMBER_ROLE.member,
                            status: ORGANIZATION_MEMBER_STATUS.invited,
                            user_id: "member-invited",
                        },
                    ],
                    error: null,
                };
            }

            if (query.table === "profiles") {
                return {
                    data: [
                        {
                            email: "zoe@example.com",
                            first_name: "Zoé",
                            id: "member-a",
                            last_name: "Martin",
                            name: null,
                        },
                        {
                            email: "adrien@example.com",
                            first_name: "Adrien",
                            id: "member-b",
                            last_name: "Dupont",
                            name: null,
                        },
                        {
                            email: "ines@example.com",
                            first_name: "Inès",
                            id: "member-invited",
                            last_name: "Bernard",
                            name: null,
                        },
                    ],
                    error: null,
                };
            }

            if (query.table === "scenarios") {
                return {
                    data: [{
                        created_at: "2026-07-20T00:00:00.000Z",
                        id: "scenario-1",
                        persona_id: "persona-1",
                        title: "Qualifier un besoin",
                    }],
                    error: null,
                };
            }

            if (query.table === "personas") {
                return {
                    data: [{ id: "persona-1", name: "Thomas Lion" }],
                    error: null,
                };
            }

            if (query.table === "sessions") {
                return {
                    data: [
                        {
                            duration_seconds: 60,
                            scenario_id: "scenario-1",
                            status: "completed",
                            user_id: "member-a",
                        },
                        {
                            duration_seconds: 40,
                            scenario_id: "scenario-1",
                            status: "in_progress",
                            user_id: "member-b",
                        },
                    ],
                    error: null,
                };
            }

            if (query.table === "quizzes") {
                return {
                    data: [{
                        created_at: "2026-07-21T00:00:00.000Z",
                        id: "quiz-1",
                        quiz_type: "knowledge",
                        title: "Quiz commercial",
                    }],
                    error: null,
                };
            }

            if (query.table === "quiz_attempts") {
                return {
                    data: [
                        { quiz_id: "quiz-1", status: "completed", user_id: "member-a" },
                        { quiz_id: "quiz-1", status: "completed", user_id: "member-b" },
                    ],
                    error: null,
                };
            }

            throw new Error(`Unexpected query for ${query.table} (${query.select ?? "no select"})`);
        });
        mocks.createAdminClient.mockReturnValue(client);

        await expect(
            getOrganizationGroupPageData("organization-1", "group-1"),
        ).resolves.toEqual({
            evaluations: [{
                assignedAt: "21 juillet 2026",
                groupName: "Sales",
                id: "quiz-1",
                learnerCount: 2,
                learnerNames: ["Adrien Dupont", "Zoé Martin"],
                status: "completed",
                title: "Quiz commercial",
                type: "Quiz de Connaissance",
            }],
            group: {
                createdAt: "18 juillet 2026",
                description: "Équipe commerciale France",
                id: "group-1",
                memberCount: 3,
                memberNames: ["Adrien Dupont", "Inès Bernard", "Zoé Martin"],
                name: "Sales",
                organizationId: "organization-1",
                organizationName: "Deepmark",
                quizCount: 1,
                roleplayCount: 1,
                status: ORGANIZATION_GROUP_STATUS.active,
            },
            members: [
                {
                    email: "adrien@example.com",
                    id: "member-b",
                    initials: "AD",
                    name: "Adrien Dupont",
                    quizCount: 1,
                    role: "Manager",
                    roleplayCount: 1,
                    status: ORGANIZATION_MEMBER_STATUS.active,
                },
                {
                    email: "ines@example.com",
                    id: "member-invited",
                    initials: "IB",
                    name: "Inès Bernard",
                    quizCount: 1,
                    role: "Learner",
                    roleplayCount: 1,
                    status: ORGANIZATION_MEMBER_STATUS.invited,
                },
                {
                    email: "zoe@example.com",
                    id: "member-a",
                    initials: "ZM",
                    name: "Zoé Martin",
                    quizCount: 2,
                    role: "Learner",
                    roleplayCount: 3,
                    status: ORGANIZATION_MEMBER_STATUS.active,
                },
            ],
            roleplays: [{
                assignedAt: "20 juillet 2026",
                groupName: "Sales",
                id: "scenario-1",
                learnerCount: 2,
                learnerNames: ["Adrien Dupont", "Zoé Martin"],
                persona: "Thomas Lion",
                status: "in_progress",
                title: "Qualifier un besoin",
            }],
        });

        expect(mocks.listOrganizationUserAssignmentCounts).toHaveBeenCalledWith(client, {
            groupId: "group-1",
            kind: "group",
            organizationId: "organization-1",
            userIds: ["member-a", "member-b", "member-invited"],
        });

        const audienceQuery = recordedQueries.find(
            (query) =>
                query.table === "organization_members"
                && query.select === "user_id, status",
        );
        expect(audienceQuery?.notEquals).toContainEqual([
            "status",
            ORGANIZATION_MEMBER_STATUS.removed,
        ]);

        for (const table of ["scenarios", "quizzes"]) {
            const contentQuery = recordedQueries.find((query) => query.table === table);
            expect(contentQuery?.equals).toContainEqual(["group_id", "group-1"]);
            expect(contentQuery?.equals).toContainEqual([
                "visibility_scope",
                CONTENT_VISIBILITY_SCOPE.group,
            ]);
            expect(contentQuery?.equals).toContainEqual([
                "status",
                ORGANIZATION_COUNTED_CONTENT_STATUS,
            ]);
            expect(contentQuery?.equals).toContainEqual([
                "is_active",
                ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE,
            ]);
        }

        const sessionQuery = recordedQueries.find((query) => query.table === "sessions");
        expect(sessionQuery?.inFilters).toContainEqual([
            "user_id",
            ["member-a", "member-b"],
        ]);
        expect(sessionQuery?.greaterThanOrEquals).toContainEqual([
            "duration_seconds",
            MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
        ]);

        const attemptQuery = recordedQueries.find((query) => query.table === "quiz_attempts");
        expect(attemptQuery?.inFilters).toContainEqual([
            "user_id",
            ["member-a", "member-b"],
        ]);
    });

    it("keeps group content visible but exposes no learners when the organization is suspended", async () => {
        const { client } = createSupabaseDouble((query) => {
            if (query.table === "organizations") {
                return {
                    data: {
                        id: "organization-1",
                        name: "Deepmark",
                        status: ORGANIZATION_STATUS.suspended,
                    },
                    error: null,
                };
            }

            if (query.table === "groups") {
                return {
                    data: {
                        created_at: "2026-07-18T00:00:00.000Z",
                        description: null,
                        id: "group-1",
                        name: "Sales",
                        organization_id: "organization-1",
                        status: ORGANIZATION_GROUP_STATUS.active,
                    },
                    error: null,
                };
            }

            if (query.table === "group_members") {
                return {
                    data: [{ assigned_at: null, user_id: "member-a" }],
                    error: null,
                };
            }

            if (
                query.table === "organization_members"
                && hasSelect(query, "user_id, status")
            ) {
                return {
                    data: [{
                        status: ORGANIZATION_MEMBER_STATUS.active,
                        user_id: "member-a",
                    }],
                    error: null,
                };
            }

            if (
                query.table === "organization_members"
                && hasSelect(query, "user_id, role, status")
            ) {
                return {
                    data: [{
                        role: ORGANIZATION_MEMBER_ROLE.member,
                        status: ORGANIZATION_MEMBER_STATUS.active,
                        user_id: "member-a",
                    }],
                    error: null,
                };
            }

            if (query.table === "profiles") {
                return {
                    data: [{
                        email: "zoe@example.com",
                        first_name: "Zoé",
                        id: "member-a",
                        last_name: "Martin",
                        name: null,
                    }],
                    error: null,
                };
            }

            if (query.table === "scenarios") {
                return {
                    data: [{
                        created_at: "2026-07-20T00:00:00.000Z",
                        id: "scenario-1",
                        persona_id: null,
                        title: "Qualifier un besoin",
                    }],
                    error: null,
                };
            }

            if (query.table === "quizzes") {
                return {
                    data: [{
                        created_at: "2026-07-21T00:00:00.000Z",
                        id: "quiz-1",
                        quiz_type: "knowledge",
                        title: "Quiz commercial",
                    }],
                    error: null,
                };
            }

            throw new Error(`Unexpected query for ${query.table} (${query.select ?? "no select"})`);
        });
        mocks.createAdminClient.mockReturnValue(client);

        const result = await getOrganizationGroupPageData("organization-1", "group-1");

        expect(result.members).toHaveLength(1);
        expect(result.group.memberCount).toBe(1);
        expect(result.roleplays).toMatchObject([{
            learnerCount: 0,
            learnerNames: [],
            status: "not_started",
        }]);
        expect(result.evaluations).toMatchObject([{
            learnerCount: 0,
            learnerNames: [],
            status: "not_started",
        }]);
    });
});
