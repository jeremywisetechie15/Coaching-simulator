import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import {
    ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE,
    ORGANIZATION_COUNTED_CONTENT_STATUS,
    createOrganizationContentScopeContext,
    resolveOrganizationContentCoverage,
    type OrganizationExplicitContentAssignment,
    type OrganizationScopedContent,
} from "@/features/organizations/domain/organization-content-scope";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveBatchRoleplayDerivedQuizAssignments } from "./resolve-batch-roleplay-derived-quiz-assignments";

type OrganizationScopeClient = ReturnType<typeof createAdminClient>;

interface OrganizationMembershipRow {
    organization_id: string | null;
    status: string | null;
    user_id: string | null;
}

interface OrganizationGroupRow {
    id: string;
    organization_id: string | null;
    status: string | null;
}

interface OrganizationGroupMembershipRow {
    group_id: string | null;
    user_id: string | null;
}

interface ContentScopeRow {
    assigned_user_id: string | null;
    group_id: string | null;
    id: string;
    is_active: boolean | null;
    organization_id: string | null;
    status: string | null;
    visibility_scope: string | null;
}

interface ScenarioScopeRow extends ContentScopeRow {
    method_id: string | null;
}

interface ScenarioAssignmentRow {
    assigned_at: string;
    scenario_id: string;
    user_id: string;
}

interface QuizAssignmentRow {
    quiz_id: string;
    user_id: string;
}

interface ScenarioQuizRow {
    quiz_id: string;
    scenario_id: string;
}

interface MethodQuizRow {
    id: string;
    method_id: string | null;
}

interface QueryResult<T> {
    data: T[] | null;
    error: unknown;
}

type QueryLike<T> = PromiseLike<QueryResult<T>>;

export interface OrganizationContentScopeCounts {
    groupCount: number;
    quizCount: number;
    roleplayCount: number;
    userCount: number;
}

export interface OrganizationContentScopeSnapshot {
    countsByOrganizationId: ReadonlyMap<string, OrganizationContentScopeCounts>;
    quizAssignments: OrganizationExplicitContentAssignment[];
    quizIdsByGroupUserId: ReadonlyMap<string, ReadonlyMap<string, ReadonlySet<string>>>;
    quizIdsByOrganizationId: ReadonlyMap<string, ReadonlySet<string>>;
    quizIdsByOrganizationUserId: ReadonlyMap<string, ReadonlyMap<string, ReadonlySet<string>>>;
    roleplayAssignments: OrganizationExplicitContentAssignment[];
    roleplayIdsByGroupUserId: ReadonlyMap<string, ReadonlyMap<string, ReadonlySet<string>>>;
    roleplayIdsByOrganizationId: ReadonlyMap<string, ReadonlySet<string>>;
    roleplayIdsByOrganizationUserId: ReadonlyMap<string, ReadonlyMap<string, ReadonlySet<string>>>;
}

const SCENARIO_SCOPE_SELECT =
    "id, visibility_scope, organization_id, group_id, assigned_user_id, status, is_active, method_id";
const QUIZ_SCOPE_SELECT =
    "id, visibility_scope, organization_id, group_id, assigned_user_id, status, is_active";

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function mapContentScopeRow(row: ContentScopeRow): OrganizationScopedContent {
    return {
        assignedUserId: row.assigned_user_id,
        groupId: row.group_id,
        id: row.id,
        isActive: row.is_active,
        organizationId: row.organization_id,
        status: row.status,
        visibilityScope: row.visibility_scope,
    };
}

async function mergeUniqueRows<T extends { id: string }>(queries: QueryLike<T>[]) {
    const rowsById = new Map<string, T>();

    for (const result of await Promise.all(queries)) {
        if (result.error) {
            throw result.error;
        }

        for (const row of result.data ?? []) {
            rowsById.set(row.id, row);
        }
    }

    return Array.from(rowsById.values());
}

async function listScenarioScopeRows(
    supabase: OrganizationScopeClient,
    {
        activeGroupIds,
        explicitScenarioIds,
        organizationIds,
        rosterUserIds,
    }: {
        activeGroupIds: string[];
        explicitScenarioIds: string[];
        organizationIds: string[];
        rosterUserIds: string[];
    },
) {
    const queries: QueryLike<ScenarioScopeRow>[] = [
        supabase
            .from("scenarios")
            .select(SCENARIO_SCOPE_SELECT)
            .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.organization)
            .in("organization_id", organizationIds)
            .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
            .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
            .returns<ScenarioScopeRow[]>(),
    ];

    if (activeGroupIds.length > 0) {
        queries.push(
            supabase
                .from("scenarios")
                .select(SCENARIO_SCOPE_SELECT)
                .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.group)
                .in("group_id", activeGroupIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<ScenarioScopeRow[]>(),
        );
    }

    if (rosterUserIds.length > 0) {
        queries.push(
            supabase
                .from("scenarios")
                .select(SCENARIO_SCOPE_SELECT)
                .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.user)
                .in("assigned_user_id", rosterUserIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<ScenarioScopeRow[]>(),
        );
    }

    if (explicitScenarioIds.length > 0) {
        queries.push(
            supabase
                .from("scenarios")
                .select(SCENARIO_SCOPE_SELECT)
                .in("id", explicitScenarioIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<ScenarioScopeRow[]>(),
        );
    }

    return mergeUniqueRows(queries);
}

async function listQuizScopeRows(
    supabase: OrganizationScopeClient,
    {
        activeGroupIds,
        explicitQuizIds,
        organizationIds,
        rosterUserIds,
    }: {
        activeGroupIds: string[];
        explicitQuizIds: string[];
        organizationIds: string[];
        rosterUserIds: string[];
    },
) {
    const queries: QueryLike<ContentScopeRow>[] = [
        supabase
            .from("quizzes")
            .select(QUIZ_SCOPE_SELECT)
            .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.organization)
            .in("organization_id", organizationIds)
            .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
            .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
            .returns<ContentScopeRow[]>(),
    ];

    if (activeGroupIds.length > 0) {
        queries.push(
            supabase
                .from("quizzes")
                .select(QUIZ_SCOPE_SELECT)
                .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.group)
                .in("group_id", activeGroupIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<ContentScopeRow[]>(),
        );
    }

    if (rosterUserIds.length > 0) {
        queries.push(
            supabase
                .from("quizzes")
                .select(QUIZ_SCOPE_SELECT)
                .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.user)
                .in("assigned_user_id", rosterUserIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<ContentScopeRow[]>(),
        );
    }

    if (explicitQuizIds.length > 0) {
        queries.push(
            supabase
                .from("quizzes")
                .select(QUIZ_SCOPE_SELECT)
                .in("id", explicitQuizIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<ContentScopeRow[]>(),
        );
    }

    return mergeUniqueRows(queries);
}

export async function listOrganizationContentScope(
    supabase: OrganizationScopeClient,
    organizationIds: string[],
): Promise<OrganizationContentScopeSnapshot> {
    const uniqueOrganizationIds = uniqueValues(organizationIds);

    if (uniqueOrganizationIds.length === 0) {
        return {
            countsByOrganizationId: new Map(),
            quizAssignments: [],
            quizIdsByGroupUserId: new Map(),
            quizIdsByOrganizationId: new Map(),
            quizIdsByOrganizationUserId: new Map(),
            roleplayAssignments: [],
            roleplayIdsByGroupUserId: new Map(),
            roleplayIdsByOrganizationId: new Map(),
            roleplayIdsByOrganizationUserId: new Map(),
        };
    }

    const [membershipsResult, groupsResult] = await Promise.all([
        supabase
            .from("organization_members")
            .select("organization_id, user_id, status")
            .in("organization_id", uniqueOrganizationIds)
            .returns<OrganizationMembershipRow[]>(),
        supabase
            .from("groups")
            .select("id, organization_id, status")
            .in("organization_id", uniqueOrganizationIds)
            .returns<OrganizationGroupRow[]>(),
    ]);

    if (membershipsResult.error) throw membershipsResult.error;
    if (groupsResult.error) throw groupsResult.error;

    const membershipRows = membershipsResult.data ?? [];
    const groupRows = groupsResult.data ?? [];
    const rosterUserIds = uniqueValues(
        membershipRows
            .filter((membership) => membership.status !== ORGANIZATION_MEMBER_STATUS.removed)
            .map((membership) => membership.user_id),
    );
    const groupIds = uniqueValues(groupRows.map((group) => group.id));
    const [groupMembershipsResult, scenarioAssignmentsResult, quizAssignmentsResult] = await Promise.all([
        groupIds.length > 0
            ? supabase
                  .from("group_members")
                  .select("group_id, user_id")
                  .in("group_id", groupIds)
                  .returns<OrganizationGroupMembershipRow[]>()
            : Promise.resolve({ data: [] as OrganizationGroupMembershipRow[], error: null }),
        rosterUserIds.length > 0
            ? supabase
                  .from("scenario_user_assignments")
                  .select("scenario_id, user_id, assigned_at")
                  .in("user_id", rosterUserIds)
                  .returns<ScenarioAssignmentRow[]>()
            : Promise.resolve({ data: [] as ScenarioAssignmentRow[], error: null }),
        rosterUserIds.length > 0
            ? supabase
                  .from("quiz_user_assignments")
                  .select("quiz_id, user_id")
                  .in("user_id", rosterUserIds)
                  .returns<QuizAssignmentRow[]>()
            : Promise.resolve({ data: [] as QuizAssignmentRow[], error: null }),
    ]);

    if (groupMembershipsResult.error) throw groupMembershipsResult.error;
    if (scenarioAssignmentsResult.error) throw scenarioAssignmentsResult.error;
    if (quizAssignmentsResult.error) throw quizAssignmentsResult.error;

    const context = createOrganizationContentScopeContext({
        groupMemberships: (groupMembershipsResult.data ?? []).map((membership) => ({
            groupId: membership.group_id,
            userId: membership.user_id,
        })),
        groups: groupRows.map((group) => ({
            id: group.id,
            organizationId: group.organization_id,
            status: group.status,
        })),
        memberships: membershipRows.map((membership) => ({
            organizationId: membership.organization_id,
            status: membership.status,
            userId: membership.user_id,
        })),
        organizationIds: uniqueOrganizationIds,
    });

    const scenarioAssignments = scenarioAssignmentsResult.data ?? [];
    const scenarioRows = await listScenarioScopeRows(supabase, {
        activeGroupIds: context.activeGroupIds,
        explicitScenarioIds: uniqueValues(scenarioAssignments.map((assignment) => assignment.scenario_id)),
        organizationIds: context.organizationIds,
        rosterUserIds: context.rosterUserIds,
    });
    const countedScenarioIds = new Set(scenarioRows.map((scenario) => scenario.id));
    const countedScenarioAssignments = scenarioAssignments.filter((assignment) =>
        countedScenarioIds.has(assignment.scenario_id),
    );
    const explicitlyAssignedScenarioIds = uniqueValues(
        countedScenarioAssignments.map((assignment) => assignment.scenario_id),
    );
    const explicitlyAssignedScenarios = scenarioRows.filter((scenario) =>
        explicitlyAssignedScenarioIds.includes(scenario.id),
    );
    const explicitScenarioMethodIds = uniqueValues(
        explicitlyAssignedScenarios.map((scenario) => scenario.method_id),
    );
    const [scenarioQuizzesResult, methodQuizzesResult] = await Promise.all([
        explicitlyAssignedScenarioIds.length > 0
            ? supabase
                  .from("scenario_quizzes")
                  .select("scenario_id, quiz_id")
                  .in("scenario_id", explicitlyAssignedScenarioIds)
                  .returns<ScenarioQuizRow[]>()
            : Promise.resolve({ data: [] as ScenarioQuizRow[], error: null }),
        explicitScenarioMethodIds.length > 0
            ? supabase
                  .from("quizzes")
                  .select("id, method_id")
                  .in("method_id", explicitScenarioMethodIds)
                  .eq("quiz_kind", "method_knowledge")
                  .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                  .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                  .returns<MethodQuizRow[]>()
            : Promise.resolve({ data: [] as MethodQuizRow[], error: null }),
    ]);

    if (scenarioQuizzesResult.error) throw scenarioQuizzesResult.error;
    if (methodQuizzesResult.error) throw methodQuizzesResult.error;

    const derivedQuizAssignments = resolveBatchRoleplayDerivedQuizAssignments({
        methodQuizRows: methodQuizzesResult.data ?? [],
        scenarioAssignments: countedScenarioAssignments,
        scenarioQuizRows: scenarioQuizzesResult.data ?? [],
        scenarioRows: explicitlyAssignedScenarios,
        userIds: context.rosterUserIds,
    });
    const roleplayAssignments = countedScenarioAssignments.map((assignment) => ({
        contentId: assignment.scenario_id,
        userId: assignment.user_id,
    }));
    const quizAssignments = [
        ...(quizAssignmentsResult.data ?? []).map((assignment) => ({
            contentId: assignment.quiz_id,
            userId: assignment.user_id,
        })),
        ...derivedQuizAssignments,
    ];
    const quizRows = await listQuizScopeRows(supabase, {
        activeGroupIds: context.activeGroupIds,
        explicitQuizIds: uniqueValues(quizAssignments.map((assignment) => assignment.contentId)),
        organizationIds: context.organizationIds,
        rosterUserIds: context.rosterUserIds,
    });
    const roleplayCoverage = resolveOrganizationContentCoverage({
        content: scenarioRows.map(mapContentScopeRow),
        context,
        explicitAssignments: roleplayAssignments,
    });
    const quizCoverage = resolveOrganizationContentCoverage({
        content: quizRows.map(mapContentScopeRow),
        context,
        explicitAssignments: quizAssignments,
    });
    const countsByOrganizationId = new Map(
        context.organizationIds.map((organizationId) => [
            organizationId,
            {
                groupCount: context.groupCountByOrganizationId.get(organizationId) ?? 0,
                quizCount: quizCoverage.contentIdsByOrganizationId.get(organizationId)?.size ?? 0,
                roleplayCount: roleplayCoverage.contentIdsByOrganizationId.get(organizationId)?.size ?? 0,
                userCount: context.userCountByOrganizationId.get(organizationId) ?? 0,
            },
        ]),
    );

    return {
        countsByOrganizationId,
        quizAssignments,
        quizIdsByGroupUserId: quizCoverage.contentIdsByGroupUserId,
        quizIdsByOrganizationId: quizCoverage.contentIdsByOrganizationId,
        quizIdsByOrganizationUserId: quizCoverage.contentIdsByOrganizationUserId,
        roleplayAssignments,
        roleplayIdsByGroupUserId: roleplayCoverage.contentIdsByGroupUserId,
        roleplayIdsByOrganizationId: roleplayCoverage.contentIdsByOrganizationId,
        roleplayIdsByOrganizationUserId: roleplayCoverage.contentIdsByOrganizationUserId,
    };
}
