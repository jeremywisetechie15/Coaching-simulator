import { requireAdmin } from "@/features/auth/server";
import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { getQuizTypeLabel, type QuizType } from "@/features/evaluations/domain";
import {
    getOrganizationCohortActivityStatus,
    indexOrganizationLearnerActivitiesByContentId,
    resolveOrganizationActivityLearnerIds,
    type OrganizationActivityAudience,
} from "@/features/organizations/domain/organization-activity";
import {
    ORGANIZATION_GROUP_STATUS,
    type OrganizationEvaluationRow,
    type OrganizationRoleplayRow,
} from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import {
    ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE,
    ORGANIZATION_COUNTED_CONTENT_STATUS,
} from "@/features/organizations/domain/organization-content-scope";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveBatchRoleplayDerivedQuizAssignments } from "./resolve-batch-roleplay-derived-quiz-assignments";

interface OrganizationMemberRow {
    status: string | null;
    user_id: string | null;
}

interface OrganizationStatusRow {
    status: string | null;
}

interface GroupRow {
    id: string;
    name: string | null;
}

interface GroupMemberRow {
    group_id: string | null;
    user_id: string | null;
}

interface ActivityTargetRow {
    assigned_user_id: string | null;
    group_id: string | null;
    organization_id: string | null;
    visibility_scope: string | null;
}

interface ScenarioRow extends ActivityTargetRow {
    created_at: string | null;
    id: string;
    persona_id: string | null;
    title: string;
}

interface PersonaRow {
    id: string;
    name: string | null;
}

interface SessionRow {
    duration_seconds: number | null;
    scenario_id: string | null;
    status: string | null;
    user_id: string | null;
}

interface QuizRow extends ActivityTargetRow {
    created_at: string | null;
    id: string;
    quiz_type: string | null;
    title: string;
}

interface QuizAttemptRow {
    quiz_id: string | null;
    status: string | null;
    user_id: string | null;
}

interface ScenarioUserAssignmentRow {
    assigned_at: string;
    scenario_id: string;
    user_id: string;
}

interface QuizUserAssignmentRow {
    quiz_id: string;
    user_id: string;
}

interface AssignedScenarioMethodRow extends ActivityTargetRow {
    id: string;
    method_id: string | null;
}

interface ScenarioQuizRow {
    quiz_id: string;
    scenario_id: string;
}

interface MethodQuizRow {
    id: string;
    method_id: string | null;
}

interface OrganizationActivityContext extends OrganizationActivityAudience {
    groupIds: string[];
    groupNamesById: Map<string, string>;
    rosterMemberIds: string[];
}

interface OrganizationActivityRows<T> {
    explicitAssigneeIdsByContentId: Map<string, string[]>;
    rows: T[];
}

const SCENARIO_ACTIVITY_SELECT =
    "id, title, persona_id, visibility_scope, organization_id, group_id, assigned_user_id, created_at";
const QUIZ_ACTIVITY_SELECT =
    "id, title, quiz_type, visibility_scope, organization_id, group_id, assigned_user_id, created_at";

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function formatLongDate(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

function getQuizType(value: string | null): QuizType {
    return value === "self_assessment" ? "self_assessment" : "knowledge";
}

function uniqueRowsById<T extends { id: string }>(rows: T[]) {
    return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function indexAssigneeIdsByContentId<T>(
    rows: T[],
    getContentId: (row: T) => string,
    getUserId: (row: T) => string,
) {
    const assigneeIdsByContentId = new Map<string, Set<string>>();

    for (const row of rows) {
        const contentId = getContentId(row);
        const assigneeIds = assigneeIdsByContentId.get(contentId) ?? new Set<string>();
        assigneeIds.add(getUserId(row));
        assigneeIdsByContentId.set(contentId, assigneeIds);
    }

    return new Map(
        Array.from(assigneeIdsByContentId, ([contentId, assigneeIds]) => [
            contentId,
            Array.from(assigneeIds).sort(),
        ]),
    );
}

function buildActiveGroupMemberIdsByGroupId(groupIds: string[], rows: GroupMemberRow[], memberIds: string[]) {
    const activeMemberIdSet = new Set(memberIds);
    const memberIdsByGroupId = new Map<string, Set<string>>(
        groupIds.map((groupId) => [groupId, new Set<string>()]),
    );

    for (const row of rows) {
        if (!row.group_id || !row.user_id || !activeMemberIdSet.has(row.user_id)) {
            continue;
        }

        memberIdsByGroupId.get(row.group_id)?.add(row.user_id);
    }

    return new Map(
        Array.from(memberIdsByGroupId, ([groupId, groupMemberIds]) => [
            groupId,
            Array.from(groupMemberIds).sort(),
        ]),
    );
}

function mapTarget(row: ActivityTargetRow) {
    return {
        assignedUserId: row.assigned_user_id,
        groupId: row.group_id,
        organizationId: row.organization_id,
        visibilityScope: row.visibility_scope,
    };
}

function resolveLearnerIdsByContentId<T extends ActivityTargetRow & { id: string }>(
    rows: T[],
    organizationId: string,
    context: OrganizationActivityContext,
    explicitAssigneeIdsByContentId: ReadonlyMap<string, readonly string[]>,
) {
    return new Map(
        rows.map((row) => [
            row.id,
            resolveOrganizationActivityLearnerIds({
                activity: mapTarget(row),
                audience: context,
                explicitAssigneeIds: explicitAssigneeIdsByContentId.get(row.id),
                organizationId,
            }),
        ]),
    );
}

async function getOrganizationActivityContext(organizationId: string): Promise<OrganizationActivityContext> {
    const adminSupabase = createAdminClient();
    const [organizationResult, groupsResult, membersResult] = await Promise.all([
        adminSupabase
            .from("organizations")
            .select("status")
            .eq("id", organizationId)
            .returns<OrganizationStatusRow[]>(),
        adminSupabase
            .from("groups")
            .select("id, name")
            .eq("organization_id", organizationId)
            .eq("status", ORGANIZATION_GROUP_STATUS.active)
            .returns<GroupRow[]>(),
        adminSupabase
            .from("organization_members")
            .select("user_id, status")
            .eq("organization_id", organizationId)
            .neq("status", ORGANIZATION_MEMBER_STATUS.removed)
            .returns<OrganizationMemberRow[]>(),
    ]);

    if (organizationResult.error) {
        throw organizationResult.error;
    }

    if (groupsResult.error) {
        throw groupsResult.error;
    }

    if (membersResult.error) {
        throw membersResult.error;
    }

    const groupIds = uniqueValues((groupsResult.data ?? []).map((group) => group.id));
    const organizationIsActive = organizationResult.data?.[0]?.status === ORGANIZATION_STATUS.active;
    const rosterMemberIds = uniqueValues((membersResult.data ?? []).map((member) => member.user_id));
    const activeMemberIds = organizationIsActive
        ? uniqueValues(
              (membersResult.data ?? [])
                  .filter((member) => member.status === ORGANIZATION_MEMBER_STATUS.active)
                  .map((member) => member.user_id),
          )
        : [];
    const groupMembersResult =
        groupIds.length > 0
            ? await adminSupabase
                  .from("group_members")
                  .select("group_id, user_id")
                  .in("group_id", groupIds)
                  .returns<GroupMemberRow[]>()
            : { data: [] as GroupMemberRow[], error: null };

    if (groupMembersResult.error) {
        throw groupMembersResult.error;
    }

    return {
        activeGroupMemberIdsByGroupId: buildActiveGroupMemberIdsByGroupId(
            groupIds,
            groupMembersResult.data ?? [],
            activeMemberIds,
        ),
        activeMemberIds,
        groupIds,
        groupNamesById: new Map((groupsResult.data ?? []).map((group) => [group.id, group.name ?? "Groupe"])),
        rosterMemberIds,
    };
}

async function fetchOrganizationScenarioRows(
    organizationId: string,
    context: OrganizationActivityContext,
): Promise<OrganizationActivityRows<ScenarioRow>> {
    const adminSupabase = createAdminClient();
    const assignmentsResult = context.rosterMemberIds.length > 0
        ? await adminSupabase
              .from("scenario_user_assignments")
              .select("scenario_id, user_id")
              .in("user_id", context.rosterMemberIds)
              .returns<ScenarioUserAssignmentRow[]>()
        : { data: [] as ScenarioUserAssignmentRow[], error: null };

    if (assignmentsResult.error) {
        throw assignmentsResult.error;
    }

    const explicitAssigneeIdsByContentId = indexAssigneeIdsByContentId(
        assignmentsResult.data ?? [],
        (assignment) => assignment.scenario_id,
        (assignment) => assignment.user_id,
    );
    const explicitScenarioIds = Array.from(explicitAssigneeIdsByContentId.keys());
    const queries = [
        adminSupabase
            .from("scenarios")
            .select(SCENARIO_ACTIVITY_SELECT)
            .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.organization)
            .eq("organization_id", organizationId)
            .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
            .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
            .returns<ScenarioRow[]>(),
    ];

    if (context.groupIds.length > 0) {
        queries.push(
            adminSupabase
                .from("scenarios")
                .select(SCENARIO_ACTIVITY_SELECT)
                .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.group)
                .in("group_id", context.groupIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<ScenarioRow[]>(),
        );
    }

    if (context.rosterMemberIds.length > 0) {
        queries.push(
            adminSupabase
                .from("scenarios")
                .select(SCENARIO_ACTIVITY_SELECT)
                .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.user)
                .in("assigned_user_id", context.rosterMemberIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<ScenarioRow[]>(),
        );
    }

    if (explicitScenarioIds.length > 0) {
        queries.push(
            adminSupabase
                .from("scenarios")
                .select(SCENARIO_ACTIVITY_SELECT)
                .in("id", explicitScenarioIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<ScenarioRow[]>(),
        );
    }

    const results = await Promise.all(queries);
    const rows: ScenarioRow[] = [];

    for (const result of results) {
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
    }

    return {
        explicitAssigneeIdsByContentId,
        rows: uniqueRowsById(rows).sort((first, second) =>
            (second.created_at ?? "").localeCompare(first.created_at ?? ""),
        ),
    };
}

async function fetchOrganizationQuizRows(
    organizationId: string,
    context: OrganizationActivityContext,
): Promise<OrganizationActivityRows<QuizRow>> {
    const adminSupabase = createAdminClient();
    const [assignmentsResult, scenarioAssignmentsResult] = context.rosterMemberIds.length > 0
        ? await Promise.all([
              adminSupabase
                  .from("quiz_user_assignments")
                  .select("quiz_id, user_id")
                  .in("user_id", context.rosterMemberIds)
                  .returns<QuizUserAssignmentRow[]>(),
              adminSupabase
                  .from("scenario_user_assignments")
                  .select("scenario_id, user_id, assigned_at")
                  .in("user_id", context.rosterMemberIds)
                  .returns<ScenarioUserAssignmentRow[]>(),
          ])
        : [
              { data: [] as QuizUserAssignmentRow[], error: null },
              { data: [] as ScenarioUserAssignmentRow[], error: null },
          ];

    if (assignmentsResult.error) {
        throw assignmentsResult.error;
    }

    if (scenarioAssignmentsResult.error) {
        throw scenarioAssignmentsResult.error;
    }

    const scenarioAssignments = scenarioAssignmentsResult.data ?? [];
    const assignedScenarioIds = uniqueValues(
        scenarioAssignments.map((assignment) => assignment.scenario_id),
    );
    const assignedScenariosResult = assignedScenarioIds.length > 0
        ? await adminSupabase
              .from("scenarios")
              .select("id, method_id, visibility_scope, organization_id, group_id, assigned_user_id")
              .in("id", assignedScenarioIds)
              .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
              .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
              .returns<AssignedScenarioMethodRow[]>()
        : { data: [] as AssignedScenarioMethodRow[], error: null };

    if (assignedScenariosResult.error) {
        throw assignedScenariosResult.error;
    }

    const assignedScenarioRows = assignedScenariosResult.data ?? [];
    const activeAssignedScenarioIdSet = new Set(assignedScenarioRows.map((scenario) => scenario.id));
    const activeScenarioAssignments = scenarioAssignments.filter((assignment) =>
        activeAssignedScenarioIdSet.has(assignment.scenario_id),
    );
    const activeAssignedScenarioIds = uniqueValues(
        activeScenarioAssignments.map((assignment) => assignment.scenario_id),
    );
    const assignedMethodIds = uniqueValues(assignedScenarioRows.map((scenario) => scenario.method_id));
    const [scenarioQuizzesResult, methodQuizzesResult] = await Promise.all([
        activeAssignedScenarioIds.length > 0
            ? adminSupabase
                  .from("scenario_quizzes")
                  .select("scenario_id, quiz_id")
                  .in("scenario_id", activeAssignedScenarioIds)
                  .returns<ScenarioQuizRow[]>()
            : Promise.resolve({ data: [] as ScenarioQuizRow[], error: null }),
        assignedMethodIds.length > 0
            ? adminSupabase
                  .from("quizzes")
                  .select("id, method_id")
                  .in("method_id", assignedMethodIds)
                  .eq("quiz_kind", "method_knowledge")
                  .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                  .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                  .returns<MethodQuizRow[]>()
            : Promise.resolve({ data: [] as MethodQuizRow[], error: null }),
    ]);

    if (scenarioQuizzesResult.error) {
        throw scenarioQuizzesResult.error;
    }

    if (methodQuizzesResult.error) {
        throw methodQuizzesResult.error;
    }

    const derivedAssignments = resolveBatchRoleplayDerivedQuizAssignments({
        methodQuizRows: methodQuizzesResult.data ?? [],
        scenarioAssignments: activeScenarioAssignments,
        scenarioQuizRows: scenarioQuizzesResult.data ?? [],
        scenarioRows: assignedScenarioRows,
        userIds: context.rosterMemberIds,
    });
    const quizAssignments = [
        ...(assignmentsResult.data ?? []).map((assignment) => ({
            contentId: assignment.quiz_id,
            userId: assignment.user_id,
        })),
        ...derivedAssignments,
    ];

    const explicitAssigneeIdsByContentId = indexAssigneeIdsByContentId(
        quizAssignments,
        (assignment) => assignment.contentId,
        (assignment) => assignment.userId,
    );
    const explicitQuizIds = Array.from(explicitAssigneeIdsByContentId.keys());
    const queries = [
        adminSupabase
            .from("quizzes")
            .select(QUIZ_ACTIVITY_SELECT)
            .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.organization)
            .eq("organization_id", organizationId)
            .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
            .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
            .returns<QuizRow[]>(),
    ];

    if (context.groupIds.length > 0) {
        queries.push(
            adminSupabase
                .from("quizzes")
                .select(QUIZ_ACTIVITY_SELECT)
                .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.group)
                .in("group_id", context.groupIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<QuizRow[]>(),
        );
    }

    if (context.rosterMemberIds.length > 0) {
        queries.push(
            adminSupabase
                .from("quizzes")
                .select(QUIZ_ACTIVITY_SELECT)
                .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.user)
                .in("assigned_user_id", context.rosterMemberIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<QuizRow[]>(),
        );
    }

    if (explicitQuizIds.length > 0) {
        queries.push(
            adminSupabase
                .from("quizzes")
                .select(QUIZ_ACTIVITY_SELECT)
                .in("id", explicitQuizIds)
                .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
                .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
                .returns<QuizRow[]>(),
        );
    }

    const results = await Promise.all(queries);
    const rows: QuizRow[] = [];

    for (const result of results) {
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
    }

    return {
        explicitAssigneeIdsByContentId,
        rows: uniqueRowsById(rows).sort((first, second) =>
            (second.created_at ?? "").localeCompare(first.created_at ?? ""),
        ),
    };
}

function getTargetName(
    row: ActivityTargetRow,
    context: OrganizationActivityContext,
    explicitAssigneeIds: readonly string[],
    organizationId: string,
) {
    if (row.group_id && context.groupNamesById.has(row.group_id)) {
        return context.groupNamesById.get(row.group_id) ?? "Groupe";
    }

    if (
        row.visibility_scope === CONTENT_VISIBILITY_SCOPE.organization
        && row.organization_id === organizationId
    ) {
        return "Toute l'organisation";
    }

    if (row.assigned_user_id || explicitAssigneeIds.length > 0) {
        return "Utilisateur spécifique";
    }

    return "Toute l'organisation";
}

export async function listOrganizationRoleplays(organizationId: string): Promise<OrganizationRoleplayRow[]> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const context = await getOrganizationActivityContext(organizationId);
    const { rows, explicitAssigneeIdsByContentId } = await fetchOrganizationScenarioRows(
        organizationId,
        context,
    );
    const learnerIdsByScenarioId = resolveLearnerIdsByContentId(
        rows,
        organizationId,
        context,
        explicitAssigneeIdsByContentId,
    );
    const scenarioIds = rows.map((scenario) => scenario.id);
    const targetedLearnerIds = uniqueValues(Array.from(learnerIdsByScenarioId.values()).flat());
    const personaIds = uniqueValues(rows.map((scenario) => scenario.persona_id));
    const [personasResult, sessionsResult] = await Promise.all([
        personaIds.length > 0
            ? adminSupabase.from("personas").select("id, name").in("id", personaIds).returns<PersonaRow[]>()
            : Promise.resolve({ data: [] as PersonaRow[], error: null }),
        scenarioIds.length > 0 && targetedLearnerIds.length > 0
            ? adminSupabase
                  .from("sessions")
                  .select("scenario_id, user_id, status, duration_seconds")
                  .in("scenario_id", scenarioIds)
                  .in("user_id", targetedLearnerIds)
                  .gte("duration_seconds", MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS)
                  .returns<SessionRow[]>()
            : Promise.resolve({ data: [] as SessionRow[], error: null }),
    ]);

    if (personasResult.error) {
        throw personasResult.error;
    }

    if (sessionsResult.error) {
        throw sessionsResult.error;
    }

    const personaNamesById = new Map(
        (personasResult.data ?? []).map((persona) => [persona.id, persona.name ?? "Persona"]),
    );
    const sessionsByScenarioId = indexOrganizationLearnerActivitiesByContentId(
        sessionsResult.data ?? [],
        (session) => session.scenario_id,
        (session) => session.status,
        (session) => session.user_id,
    );

    return rows.map((scenario) => {
        const explicitAssigneeIds = explicitAssigneeIdsByContentId.get(scenario.id) ?? [];
        const learnerIds = learnerIdsByScenarioId.get(scenario.id) ?? [];

        return {
            assignedAt: formatLongDate(scenario.created_at),
            groupName: getTargetName(scenario, context, explicitAssigneeIds, organizationId),
            id: scenario.id,
            learnerCount: learnerIds.length,
            persona: scenario.persona_id
                ? personaNamesById.get(scenario.persona_id) ?? "Persona"
                : "Persona",
            status: getOrganizationCohortActivityStatus(
                learnerIds,
                sessionsByScenarioId.get(scenario.id) ?? [],
            ),
            title: scenario.title,
        };
    });
}

export async function listOrganizationEvaluations(organizationId: string): Promise<OrganizationEvaluationRow[]> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const context = await getOrganizationActivityContext(organizationId);
    const { rows, explicitAssigneeIdsByContentId } = await fetchOrganizationQuizRows(
        organizationId,
        context,
    );
    const learnerIdsByQuizId = resolveLearnerIdsByContentId(
        rows,
        organizationId,
        context,
        explicitAssigneeIdsByContentId,
    );
    const quizIds = rows.map((quiz) => quiz.id);
    const targetedLearnerIds = uniqueValues(Array.from(learnerIdsByQuizId.values()).flat());
    const attemptsResult = quizIds.length > 0 && targetedLearnerIds.length > 0
        ? await adminSupabase
              .from("quiz_attempts")
              .select("quiz_id, user_id, status")
              .in("quiz_id", quizIds)
              .in("user_id", targetedLearnerIds)
              .returns<QuizAttemptRow[]>()
        : { data: [] as QuizAttemptRow[], error: null };

    if (attemptsResult.error) {
        throw attemptsResult.error;
    }

    const attemptsByQuizId = indexOrganizationLearnerActivitiesByContentId(
        attemptsResult.data ?? [],
        (attempt) => attempt.quiz_id,
        (attempt) => attempt.status,
        (attempt) => attempt.user_id,
    );

    return rows.map((quiz) => {
        const explicitAssigneeIds = explicitAssigneeIdsByContentId.get(quiz.id) ?? [];
        const learnerIds = learnerIdsByQuizId.get(quiz.id) ?? [];

        return {
            assignedAt: formatLongDate(quiz.created_at),
            groupName: getTargetName(quiz, context, explicitAssigneeIds, organizationId),
            id: quiz.id,
            learnerCount: learnerIds.length,
            status: getOrganizationCohortActivityStatus(
                learnerIds,
                attemptsByQuizId.get(quiz.id) ?? [],
            ),
            title: quiz.title,
            type: getQuizTypeLabel(getQuizType(quiz.quiz_type)),
        };
    });
}
