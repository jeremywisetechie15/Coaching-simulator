import { beforeEach, describe, expect, it, vi } from "vitest";
import { CONTENT_STATUS, CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { ORGANIZATION_GROUP_STATUS } from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain";

const mocks = vi.hoisted(() => ({
    createAdminClient: vi.fn(),
    requireAdmin: vi.fn(),
}));

vi.mock("@/features/auth/server", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

import { listOrganizationEvaluations, listOrganizationRoleplays } from "./list-organization-activity";

interface RecordedQuery {
    equals: Array<[string, unknown]>;
    greaterThanOrEqual: Array<[string, unknown]>;
    inFilters: Array<[string, unknown[]]>;
    notEquals: Array<[string, unknown]>;
    select?: string;
    table: string;
}

interface QueryResult {
    data: unknown[];
    error: null;
}

function hasEqual(query: RecordedQuery, column: string, value: unknown) {
    return query.equals.some(([currentColumn, currentValue]) =>
        currentColumn === column && currentValue === value,
    );
}

function hasIn(query: RecordedQuery, column: string) {
    return query.inFilters.some(([currentColumn]) => currentColumn === column);
}

function createSupabaseDouble(resolve: (query: RecordedQuery) => QueryResult) {
    const recordedQueries: RecordedQuery[] = [];

    return {
        client: {
            from: vi.fn((table: string) => {
                const recorded: RecordedQuery = {
                    equals: [],
                    greaterThanOrEqual: [],
                    inFilters: [],
                    notEquals: [],
                    table,
                };
                const query = {
                    eq: vi.fn((column: string, value: unknown) => {
                        recorded.equals.push([column, value]);
                        return query;
                    }),
                    gte: vi.fn((column: string, value: unknown) => {
                        recorded.greaterThanOrEqual.push([column, value]);
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

const activityTargetFields = {
    assigned_user_id: null,
    group_id: null,
    organization_id: null,
    visibility_scope: CONTENT_VISIBILITY_SCOPE.public,
};

describe("organization activity lists", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireAdmin.mockResolvedValue({ userId: "admin-1" });
    });

    it("lists roleplays for their active audience and calculates cohort progress", async () => {
        const { client, recordedQueries } = createSupabaseDouble((query) => {
            if (query.table === "organizations") {
                return { data: [{ status: ORGANIZATION_STATUS.active }], error: null };
            }
            if (query.table === "groups") {
                return { data: [{ id: "group-1", name: "Équipe Alpha" }], error: null };
            }
            if (query.table === "organization_members") {
                return {
                    data: [
                        { status: ORGANIZATION_MEMBER_STATUS.active, user_id: "member-a" },
                        { status: ORGANIZATION_MEMBER_STATUS.active, user_id: "member-b" },
                        { status: ORGANIZATION_MEMBER_STATUS.active, user_id: "member-c" },
                        { status: ORGANIZATION_MEMBER_STATUS.invited, user_id: "invited-member" },
                    ],
                    error: null,
                };
            }
            if (query.table === "group_members") {
                return {
                    data: [
                        { group_id: "group-1", user_id: "member-a" },
                        { group_id: "group-1", user_id: "member-b" },
                        { group_id: "group-1", user_id: "invited-member" },
                    ],
                    error: null,
                };
            }
            if (query.table === "scenario_user_assignments") {
                return {
                    data: [
                        {
                            assigned_at: "2026-07-15T00:00:00.000Z",
                            scenario_id: "scenario-explicit",
                            user_id: "member-c",
                        },
                        {
                            assigned_at: "2026-07-15T00:00:00.000Z",
                            scenario_id: "scenario-organization",
                            user_id: "member-a",
                        },
                        {
                            assigned_at: "2026-07-15T00:00:00.000Z",
                            scenario_id: "scenario-explicit",
                            user_id: "suspended-member",
                        },
                        {
                            assigned_at: "2026-07-16T00:00:00.000Z",
                            scenario_id: "scenario-invited",
                            user_id: "invited-member",
                        },
                    ],
                    error: null,
                };
            }
            if (query.table === "scenarios" && hasEqual(query, "visibility_scope", CONTENT_VISIBILITY_SCOPE.organization)) {
                return {
                    data: [{
                        ...activityTargetFields,
                        created_at: "2026-07-14T00:00:00.000Z",
                        id: "scenario-organization",
                        organization_id: "organization-1",
                        persona_id: "persona-1",
                        title: "Organisation",
                        visibility_scope: CONTENT_VISIBILITY_SCOPE.organization,
                    }],
                    error: null,
                };
            }
            if (query.table === "scenarios" && hasEqual(query, "visibility_scope", CONTENT_VISIBILITY_SCOPE.group)) {
                return {
                    data: [{
                        ...activityTargetFields,
                        created_at: "2026-07-13T00:00:00.000Z",
                        group_id: "group-1",
                        id: "scenario-group",
                        organization_id: "organization-1",
                        persona_id: null,
                        title: "Groupe",
                        visibility_scope: CONTENT_VISIBILITY_SCOPE.group,
                    }],
                    error: null,
                };
            }
            if (query.table === "scenarios" && hasEqual(query, "visibility_scope", CONTENT_VISIBILITY_SCOPE.user)) {
                return {
                    data: [{
                        ...activityTargetFields,
                        assigned_user_id: "member-a",
                        created_at: "2026-07-12T00:00:00.000Z",
                        id: "scenario-user",
                        persona_id: null,
                        title: "Utilisateur",
                        visibility_scope: CONTENT_VISIBILITY_SCOPE.user,
                    }],
                    error: null,
                };
            }
            if (query.table === "scenarios" && hasIn(query, "id")) {
                return {
                    data: [
                        {
                            ...activityTargetFields,
                            created_at: "2026-07-15T00:00:00.000Z",
                            id: "scenario-explicit",
                            persona_id: null,
                            title: "Explicite",
                        },
                        {
                            ...activityTargetFields,
                            created_at: "2026-07-16T00:00:00.000Z",
                            id: "scenario-invited",
                            persona_id: null,
                            title: "Invité",
                        },
                    ],
                    error: null,
                };
            }
            if (query.table === "personas") {
                return { data: [{ id: "persona-1", name: "Camille" }], error: null };
            }
            if (query.table === "sessions") {
                return {
                    data: [
                        { duration_seconds: 60, scenario_id: "scenario-organization", status: "completed", user_id: "member-a" },
                        { duration_seconds: 60, scenario_id: "scenario-group", status: "completed", user_id: "member-a" },
                        { duration_seconds: 60, scenario_id: "scenario-group", status: "completed", user_id: "member-b" },
                        { duration_seconds: 60, scenario_id: "scenario-user", status: "completed", user_id: "member-a" },
                        { duration_seconds: 60, scenario_id: "scenario-explicit", status: null, user_id: "member-c" },
                        { duration_seconds: 60, scenario_id: "scenario-organization", status: "completed", user_id: "outside-user" },
                    ],
                    error: null,
                };
            }
            throw new Error(`Unexpected query for ${query.table}`);
        });
        mocks.createAdminClient.mockReturnValue(client);

        const result = await listOrganizationRoleplays("organization-1");

        expect(result.map(({ id, learnerCount, status }) => ({ id, learnerCount, status }))).toEqual([
            { id: "scenario-invited", learnerCount: 0, status: "not_started" },
            { id: "scenario-explicit", learnerCount: 1, status: "in_progress" },
            { id: "scenario-organization", learnerCount: 3, status: "in_progress" },
            { id: "scenario-group", learnerCount: 2, status: "completed" },
            { id: "scenario-user", learnerCount: 1, status: "completed" },
        ]);
        expect(result.find((row) => row.id === "scenario-invited")?.groupName).toBe("Utilisateur spécifique");
        expect(result.find((row) => row.id === "scenario-organization")?.groupName).toBe("Toute l'organisation");
        expect(result.find((row) => row.id === "scenario-organization")?.persona).toBe("Camille");

        const memberQuery = recordedQueries.find((query) => query.table === "organization_members");
        const groupQuery = recordedQueries.find((query) => query.table === "groups");
        const sessionQuery = recordedQueries.find((query) => query.table === "sessions");
        const scenarioQueries = recordedQueries.filter((query) => query.table === "scenarios");

        expect(memberQuery?.notEquals).toContainEqual(["status", ORGANIZATION_MEMBER_STATUS.removed]);
        expect(groupQuery?.equals).toContainEqual(["status", ORGANIZATION_GROUP_STATUS.active]);
        expect(sessionQuery?.greaterThanOrEqual).toContainEqual([
            "duration_seconds",
            MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS,
        ]);
        expect(sessionQuery?.inFilters).toContainEqual([
            "user_id",
            ["member-c", "member-a", "member-b"],
        ]);
        for (const query of scenarioQueries) {
            expect(query.equals).toContainEqual(["status", CONTENT_STATUS.published]);
            expect(query.equals).toContainEqual(["is_active", true]);
        }
    });

    it("lists quizzes for their exact cohort and ignores attempts from other active members", async () => {
        const { client, recordedQueries } = createSupabaseDouble((query) => {
            if (query.table === "organizations") {
                return { data: [{ status: ORGANIZATION_STATUS.active }], error: null };
            }
            if (query.table === "groups") {
                return { data: [{ id: "group-1", name: "Équipe Alpha" }], error: null };
            }
            if (query.table === "organization_members") {
                return {
                    data: [
                        { status: ORGANIZATION_MEMBER_STATUS.active, user_id: "member-a" },
                        { status: ORGANIZATION_MEMBER_STATUS.active, user_id: "member-b" },
                        { status: ORGANIZATION_MEMBER_STATUS.active, user_id: "member-c" },
                    ],
                    error: null,
                };
            }
            if (query.table === "group_members") {
                return {
                    data: [
                        { group_id: "group-1", user_id: "member-a" },
                        { group_id: "group-1", user_id: "member-b" },
                    ],
                    error: null,
                };
            }
            if (query.table === "quiz_user_assignments") {
                return {
                    data: [{ quiz_id: "quiz-explicit", user_id: "member-c" }],
                    error: null,
                };
            }
            if (query.table === "scenario_user_assignments") {
                return {
                    data: [{
                        assigned_at: "2026-07-16T12:00:00.000Z",
                        scenario_id: "scenario-assigned",
                        user_id: "member-b",
                    }],
                    error: null,
                };
            }
            if (query.table === "scenarios" && query.select?.includes("method_id")) {
                return {
                    data: [{
                        assigned_user_id: null,
                        group_id: null,
                        id: "scenario-assigned",
                        method_id: "method-1",
                        organization_id: null,
                        visibility_scope: CONTENT_VISIBILITY_SCOPE.public,
                    }],
                    error: null,
                };
            }
            if (query.table === "scenario_quizzes") {
                return {
                    data: [{ quiz_id: "quiz-linked", scenario_id: "scenario-assigned" }],
                    error: null,
                };
            }
            if (query.table === "quizzes" && hasIn(query, "method_id")) {
                return { data: [{ id: "quiz-method", method_id: "method-1" }], error: null };
            }
            if (query.table === "quizzes" && hasEqual(query, "visibility_scope", CONTENT_VISIBILITY_SCOPE.organization)) {
                return {
                    data: [{
                        ...activityTargetFields,
                        created_at: "2026-07-14T00:00:00.000Z",
                        id: "quiz-organization",
                        organization_id: "organization-1",
                        quiz_type: "knowledge",
                        title: "Organisation",
                        visibility_scope: CONTENT_VISIBILITY_SCOPE.organization,
                    }],
                    error: null,
                };
            }
            if (query.table === "quizzes" && hasEqual(query, "visibility_scope", CONTENT_VISIBILITY_SCOPE.group)) {
                return {
                    data: [{
                        ...activityTargetFields,
                        created_at: "2026-07-13T00:00:00.000Z",
                        group_id: "group-1",
                        id: "quiz-group",
                        organization_id: "organization-1",
                        quiz_type: "self_assessment",
                        title: "Groupe",
                        visibility_scope: CONTENT_VISIBILITY_SCOPE.group,
                    }],
                    error: null,
                };
            }
            if (query.table === "quizzes" && hasEqual(query, "visibility_scope", CONTENT_VISIBILITY_SCOPE.user)) {
                return { data: [], error: null };
            }
            if (query.table === "quizzes" && hasIn(query, "id")) {
                return {
                    data: [
                        {
                            ...activityTargetFields,
                            created_at: "2026-07-15T00:00:00.000Z",
                            id: "quiz-explicit",
                            quiz_type: "knowledge",
                            title: "Explicite",
                        },
                        {
                            ...activityTargetFields,
                            created_at: "2026-07-16T00:00:00.000Z",
                            id: "quiz-linked",
                            quiz_type: "knowledge",
                            title: "Quiz lié",
                        },
                        {
                            ...activityTargetFields,
                            created_at: "2026-07-17T00:00:00.000Z",
                            id: "quiz-method",
                            quiz_type: "knowledge",
                            title: "Quiz méthode",
                        },
                    ],
                    error: null,
                };
            }
            if (query.table === "quiz_attempts") {
                return {
                    data: [
                        { quiz_id: "quiz-organization", status: "completed", user_id: "member-a" },
                        { quiz_id: "quiz-group", status: "completed", user_id: "member-a" },
                        { quiz_id: "quiz-group", status: "completed", user_id: "member-b" },
                        { quiz_id: "quiz-group", status: "completed", user_id: "member-c" },
                        { quiz_id: "quiz-explicit", status: "completed", user_id: "member-c" },
                        { quiz_id: "quiz-linked", status: "completed", user_id: "member-b" },
                        { quiz_id: "quiz-method", status: "completed", user_id: "member-b" },
                    ],
                    error: null,
                };
            }
            throw new Error(`Unexpected query for ${query.table}`);
        });
        mocks.createAdminClient.mockReturnValue(client);

        const result = await listOrganizationEvaluations("organization-1");

        expect(result.map(({ id, learnerCount, status }) => ({ id, learnerCount, status }))).toEqual([
            { id: "quiz-method", learnerCount: 1, status: "completed" },
            { id: "quiz-linked", learnerCount: 1, status: "completed" },
            { id: "quiz-explicit", learnerCount: 1, status: "completed" },
            { id: "quiz-organization", learnerCount: 3, status: "in_progress" },
            { id: "quiz-group", learnerCount: 2, status: "completed" },
        ]);

        const attemptsQuery = recordedQueries.find((query) => query.table === "quiz_attempts");
        const quizQueries = recordedQueries.filter((query) => query.table === "quizzes");
        const targetedUserIds = attemptsQuery?.inFilters.find(([column]) => column === "user_id")?.[1];
        expect(new Set(targetedUserIds)).toEqual(new Set(["member-a", "member-b", "member-c"]));
        for (const query of quizQueries) {
            expect(query.equals).toContainEqual(["status", CONTENT_STATUS.published]);
            expect(query.equals).toContainEqual(["is_active", true]);
        }
    });

    it("keeps configured content visible with an empty cohort when the organization is suspended", async () => {
        const { client, recordedQueries } = createSupabaseDouble((query) => {
            if (query.table === "organizations") {
                return { data: [{ status: ORGANIZATION_STATUS.suspended }], error: null };
            }
            if (query.table === "groups") {
                return { data: [], error: null };
            }
            if (query.table === "organization_members") {
                return {
                    data: [{ status: ORGANIZATION_MEMBER_STATUS.active, user_id: "member-a" }],
                    error: null,
                };
            }
            if (query.table === "scenario_user_assignments") {
                return { data: [], error: null };
            }
            if (query.table === "scenarios" && hasEqual(query, "visibility_scope", CONTENT_VISIBILITY_SCOPE.organization)) {
                return {
                    data: [{
                        ...activityTargetFields,
                        created_at: "2026-07-17T00:00:00.000Z",
                        id: "scenario-organization",
                        organization_id: "organization-1",
                        persona_id: null,
                        title: "Organisation suspendue",
                        visibility_scope: CONTENT_VISIBILITY_SCOPE.organization,
                    }],
                    error: null,
                };
            }
            if (query.table === "scenarios" && hasEqual(query, "visibility_scope", CONTENT_VISIBILITY_SCOPE.user)) {
                return { data: [], error: null };
            }
            throw new Error(`Unexpected query for ${query.table}`);
        });
        mocks.createAdminClient.mockReturnValue(client);

        await expect(listOrganizationRoleplays("organization-1")).resolves.toEqual([{
            assignedAt: "17 juillet 2026",
            groupName: "Toute l'organisation",
            id: "scenario-organization",
            learnerCount: 0,
            persona: "Persona",
            status: "not_started",
            title: "Organisation suspendue",
        }]);
        expect(recordedQueries.some((query) => query.table === "sessions")).toBe(false);
    });
});
