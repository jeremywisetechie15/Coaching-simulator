import { requireAdmin } from "@/features/auth/server";
import { getQuizTypeLabel, type QuizType } from "@/features/evaluations/domain";
import type {
    OrganizationActivityStatus,
    OrganizationEvaluationRow,
    OrganizationRoleplayRow,
} from "@/features/organizations/domain/organization-detail";
import { createAdminClient } from "@/lib/supabase/admin";

interface OrganizationMemberRow {
    user_id: string | null;
}

interface GroupRow {
    id: string;
    name: string | null;
}

interface GroupMemberRow {
    group_id: string | null;
    user_id: string | null;
}

interface ScenarioRow {
    assigned_user_id?: string | null;
    created_at: string | null;
    group_id?: string | null;
    id: string;
    persona_id: string | null;
    title: string;
}

interface PersonaRow {
    id: string;
    name: string | null;
}

interface SessionRow {
    scenario_id: string | null;
    status: string | null;
}

interface QuizRow {
    assigned_user_id?: string | null;
    created_at: string | null;
    group_id?: string | null;
    id: string;
    quiz_type: string | null;
    title: string;
}

interface QuizAttemptRow {
    quiz_id: string | null;
    status: string | null;
    user_id: string | null;
}

interface OrganizationActivityContext {
    groupMemberCounts: Map<string, number>;
    groupNamesById: Map<string, string>;
    groupIds: string[];
    memberIds: string[];
}

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

function getActivityStatus(statuses: string[]): OrganizationActivityStatus {
    if (statuses.some((status) => status === "completed")) {
        return "completed";
    }

    if (statuses.length > 0) {
        return "in_progress";
    }

    return "not_started";
}

function getQuizType(value: string | null): QuizType {
    return value === "self_assessment" ? "self_assessment" : "knowledge";
}

function countByGroupId(rows: GroupMemberRow[]) {
    const counts = new Map<string, number>();

    for (const row of rows) {
        if (!row.group_id) continue;
        counts.set(row.group_id, (counts.get(row.group_id) ?? 0) + 1);
    }

    return counts;
}

function uniqueRowsById<T extends { id: string }>(rows: T[]) {
    return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

async function getOrganizationActivityContext(organizationId: string): Promise<OrganizationActivityContext> {
    const adminSupabase = createAdminClient();
    const [groupsResult, membersResult] = await Promise.all([
        adminSupabase
            .from("groups")
            .select("id, name")
            .eq("organization_id", organizationId)
            .neq("status", "archived")
            .returns<GroupRow[]>(),
        adminSupabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", organizationId)
            .returns<OrganizationMemberRow[]>(),
    ]);

    if (groupsResult.error) {
        throw groupsResult.error;
    }

    if (membersResult.error) {
        throw membersResult.error;
    }

    const groupIds = (groupsResult.data ?? []).map((group) => group.id);
    const memberIds = uniqueValues((membersResult.data ?? []).map((member) => member.user_id));
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
        groupIds,
        groupMemberCounts: countByGroupId(groupMembersResult.data ?? []),
        groupNamesById: new Map((groupsResult.data ?? []).map((group) => [group.id, group.name ?? "Groupe"])),
        memberIds,
    };
}

async function fetchOrganizationScenarioRows(
    organizationId: string,
    context: OrganizationActivityContext,
) {
    const adminSupabase = createAdminClient();
    const queries = [
        adminSupabase
            .from("scenarios")
            .select("id, title, persona_id, group_id, assigned_user_id, created_at")
            .eq("organization_id", organizationId)
            .neq("status", "archived")
            .returns<ScenarioRow[]>(),
    ];

    if (context.memberIds.length > 0) {
        queries.push(
            adminSupabase
                .from("scenarios")
                .select("id, title, persona_id, group_id, assigned_user_id, created_at")
                .in("assigned_user_id", context.memberIds)
                .neq("status", "archived")
                .returns<ScenarioRow[]>(),
        );
    }

    const results = await Promise.all(queries);
    const rows: ScenarioRow[] = [];

    for (const result of results) {
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
    }

    return uniqueRowsById(rows).sort((first, second) => {
        return (second.created_at ?? "").localeCompare(first.created_at ?? "");
    });
}

async function fetchOrganizationQuizRows(
    organizationId: string,
    context: OrganizationActivityContext,
) {
    const adminSupabase = createAdminClient();
    const queries = [
        adminSupabase
            .from("quizzes")
            .select("id, title, quiz_type, group_id, assigned_user_id, created_at")
            .eq("organization_id", organizationId)
            .neq("status", "archived")
            .returns<QuizRow[]>(),
    ];

    if (context.memberIds.length > 0) {
        queries.push(
            adminSupabase
                .from("quizzes")
                .select("id, title, quiz_type, group_id, assigned_user_id, created_at")
                .in("assigned_user_id", context.memberIds)
                .neq("status", "archived")
                .returns<QuizRow[]>(),
        );
    }

    const results = await Promise.all(queries);
    const rows: QuizRow[] = [];

    for (const result of results) {
        if (result.error) throw result.error;
        rows.push(...(result.data ?? []));
    }

    return uniqueRowsById(rows).sort((first, second) => {
        return (second.created_at ?? "").localeCompare(first.created_at ?? "");
    });
}

function getLearnerCount(
    row: { assigned_user_id?: string | null; group_id?: string | null },
    context: OrganizationActivityContext,
) {
    if (row.assigned_user_id) {
        return 1;
    }

    if (row.group_id) {
        return context.groupMemberCounts.get(row.group_id) ?? 0;
    }

    return context.memberIds.length;
}

function getGroupName(
    row: { assigned_user_id?: string | null; group_id?: string | null },
    context: OrganizationActivityContext,
) {
    if (row.group_id) {
        return context.groupNamesById.get(row.group_id) ?? "Groupe";
    }

    return row.assigned_user_id ? "Utilisateur spécifique" : "Toute l'organisation";
}

export async function listOrganizationRoleplays(organizationId: string): Promise<OrganizationRoleplayRow[]> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const context = await getOrganizationActivityContext(organizationId);
    const rows = await fetchOrganizationScenarioRows(organizationId, context);
    const scenarioIds = rows.map((scenario) => scenario.id);
    const personaIds = uniqueValues(rows.map((scenario) => scenario.persona_id));
    const [personasResult, sessionsResult] = await Promise.all([
        personaIds.length > 0
            ? adminSupabase.from("personas").select("id, name").in("id", personaIds).returns<PersonaRow[]>()
            : Promise.resolve({ data: [] as PersonaRow[], error: null }),
        scenarioIds.length > 0
            ? adminSupabase.from("sessions").select("scenario_id, status").in("scenario_id", scenarioIds).returns<SessionRow[]>()
            : Promise.resolve({ data: [] as SessionRow[], error: null }),
    ]);

    if (personasResult.error) {
        throw personasResult.error;
    }

    if (sessionsResult.error) {
        throw sessionsResult.error;
    }

    const personaNamesById = new Map((personasResult.data ?? []).map((persona) => [persona.id, persona.name ?? "Persona"]));
    const statusesByScenarioId = new Map<string, string[]>();

    for (const session of sessionsResult.data ?? []) {
        if (!session.scenario_id || !session.status) continue;
        statusesByScenarioId.set(session.scenario_id, [
            ...(statusesByScenarioId.get(session.scenario_id) ?? []),
            session.status,
        ]);
    }

    return rows.map((scenario) => ({
        assignedAt: formatLongDate(scenario.created_at),
        groupName: getGroupName(scenario, context),
        id: scenario.id,
        learnerCount: getLearnerCount(scenario, context),
        persona: scenario.persona_id ? personaNamesById.get(scenario.persona_id) ?? "Persona" : "Persona",
        status: getActivityStatus(statusesByScenarioId.get(scenario.id) ?? []),
        title: scenario.title,
    }));
}

export async function listOrganizationEvaluations(organizationId: string): Promise<OrganizationEvaluationRow[]> {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const context = await getOrganizationActivityContext(organizationId);
    const rows = await fetchOrganizationQuizRows(organizationId, context);
    const quizIds = rows.map((quiz) => quiz.id);
    const attemptsResult =
        quizIds.length > 0 && context.memberIds.length > 0
            ? await adminSupabase
                  .from("quiz_attempts")
                  .select("quiz_id, user_id, status")
                  .in("quiz_id", quizIds)
                  .in("user_id", context.memberIds)
                  .returns<QuizAttemptRow[]>()
            : { data: [] as QuizAttemptRow[], error: null };

    if (attemptsResult.error) {
        throw attemptsResult.error;
    }

    const statusesByQuizId = new Map<string, string[]>();

    for (const attempt of attemptsResult.data ?? []) {
        if (!attempt.quiz_id || !attempt.status) continue;
        statusesByQuizId.set(attempt.quiz_id, [
            ...(statusesByQuizId.get(attempt.quiz_id) ?? []),
            attempt.status,
        ]);
    }

    return rows.map((quiz) => ({
        assignedAt: formatLongDate(quiz.created_at),
        groupName: getGroupName(quiz, context),
        id: quiz.id,
        learnerCount: getLearnerCount(quiz, context),
        status: getActivityStatus(statusesByQuizId.get(quiz.id) ?? []),
        title: quiz.title,
        type: getQuizTypeLabel(getQuizType(quiz.quiz_type)),
    }));
}
