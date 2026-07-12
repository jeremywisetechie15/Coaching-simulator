import { requireAdmin } from "@/features/auth/server";
import { getQuizTypeLabel, type QuizType } from "@/features/evaluations/domain";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain";
import type { CreateOrganizationGroupDto } from "@/features/organizations/dto/create-organization-group.dto";
import type {
    OrganizationActivityStatus,
    OrganizationEvaluationRow,
    OrganizationGroupDetail,
    OrganizationRoleplayRow,
    OrganizationUserRow,
} from "@/features/organizations/domain/organization-detail";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapOrganizationGroupRow, type OrganizationGroupDbRow } from "./organization-group.mapper";
import {
    mapOrganizationUserRows,
    type OrganizationMembershipDbRow,
    type OrganizationUserProfileDbRow,
} from "./list-organization-users";

interface GroupDbRow extends OrganizationGroupDbRow {
    organization_id: string;
}

interface OrganizationNameRow {
    id: string;
    name: string | null;
}

interface GroupMemberRow {
    assigned_at?: string | null;
    user_id: string | null;
}

interface ScenarioRow {
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
}

interface QuizRow {
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

export interface OrganizationGroupPageData {
    evaluations: OrganizationEvaluationRow[];
    group: OrganizationGroupDetail;
    members: OrganizationUserRow[];
    roleplays: OrganizationRoleplayRow[];
}

function isPostgresError(error: unknown): error is { code?: string } {
    return typeof error === "object" && error !== null && "code" in error;
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

function uniqueValues(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
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

function mapGroupDetail(
    group: GroupDbRow,
    organization: OrganizationNameRow,
    memberCount: number,
    roleplayCount: number,
    quizCount: number,
): OrganizationGroupDetail {
    return {
        ...mapOrganizationGroupRow(group, memberCount, roleplayCount, quizCount),
        organizationId: organization.id,
        organizationName: organization.name ?? "Organisation",
    };
}

async function resolveGroupContext(
    supabase: ReturnType<typeof createAdminClient>,
    organizationId: string,
    groupId: string,
) {
    const [{ data: organization, error: organizationError }, { data: group, error: groupError }] = await Promise.all([
        supabase
            .from("organizations")
            .select("id, name")
            .eq("id", organizationId)
            .maybeSingle<OrganizationNameRow>(),
        supabase
            .from("groups")
            .select("id, organization_id, name, description, status, created_at")
            .eq("id", groupId)
            .eq("organization_id", organizationId)
            .neq("status", "archived")
            .maybeSingle<GroupDbRow>(),
    ]);

    if (organizationError) {
        throw organizationError;
    }

    if (groupError) {
        throw groupError;
    }

    if (!organization || !group) {
        throw new NotFoundError("Groupe introuvable.");
    }

    return { group, organization };
}

async function listGroupMemberIds(supabase: ReturnType<typeof createAdminClient>, groupId: string) {
    const { data, error } = await supabase
        .from("group_members")
        .select("user_id, assigned_at")
        .eq("group_id", groupId)
        .returns<GroupMemberRow[]>();

    if (error) {
        throw error;
    }

    return uniqueValues((data ?? []).map((member) => member.user_id));
}

async function listGroupMembers(
    supabase: ReturnType<typeof createAdminClient>,
    organizationId: string,
    memberIds: string[],
): Promise<OrganizationUserRow[]> {
    if (memberIds.length === 0) {
        return [];
    }

    const [{ data: memberships, error: membershipsError }, { data: profiles, error: profilesError }] = await Promise.all([
        supabase
            .from("organization_members")
            .select("user_id, role, status")
            .eq("organization_id", organizationId)
            .in("user_id", memberIds)
            .returns<OrganizationMembershipDbRow[]>(),
        supabase
            .from("profiles")
            .select("id, email, name, first_name, last_name")
            .in("id", memberIds)
            .returns<OrganizationUserProfileDbRow[]>(),
    ]);

    if (membershipsError) {
        throw membershipsError;
    }

    if (profilesError) {
        throw profilesError;
    }

    return mapOrganizationUserRows(memberships ?? [], profiles ?? []);
}

async function listGroupRoleplays(
    supabase: ReturnType<typeof createAdminClient>,
    groupId: string,
    groupName: string,
    learnerCount: number,
): Promise<OrganizationRoleplayRow[]> {
    const { data: scenarios, error } = await supabase
        .from("scenarios")
        .select("id, title, persona_id, created_at")
        .eq("group_id", groupId)
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .returns<ScenarioRow[]>();

    if (error) {
        throw error;
    }

    const rows = scenarios ?? [];
    const scenarioIds = rows.map((scenario) => scenario.id);
    const personaIds = uniqueValues(rows.map((scenario) => scenario.persona_id));
    const [personasResult, sessionsResult] = await Promise.all([
        personaIds.length > 0
            ? supabase.from("personas").select("id, name").in("id", personaIds).returns<PersonaRow[]>()
            : Promise.resolve({ data: [] as PersonaRow[], error: null }),
        scenarioIds.length > 0
            ? supabase
                  .from("sessions")
                  .select("scenario_id, status, duration_seconds")
                  .in("scenario_id", scenarioIds)
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

    const personaNameById = new Map((personasResult.data ?? []).map((persona) => [persona.id, persona.name ?? "Persona"]));
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
        groupName,
        id: scenario.id,
        learnerCount,
        persona: scenario.persona_id ? personaNameById.get(scenario.persona_id) ?? "Persona" : "Persona",
        status: getActivityStatus(statusesByScenarioId.get(scenario.id) ?? []),
        title: scenario.title,
    }));
}

async function listGroupEvaluations(
    supabase: ReturnType<typeof createAdminClient>,
    groupId: string,
    groupName: string,
    memberIds: string[],
): Promise<OrganizationEvaluationRow[]> {
    const { data: quizzes, error } = await supabase
        .from("quizzes")
        .select("id, title, quiz_type, created_at")
        .eq("group_id", groupId)
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .returns<QuizRow[]>();

    if (error) {
        throw error;
    }

    const rows = quizzes ?? [];
    const quizIds = rows.map((quiz) => quiz.id);
    const attemptsResult =
        quizIds.length > 0 && memberIds.length > 0
            ? await supabase
                  .from("quiz_attempts")
                  .select("quiz_id, user_id, status")
                  .in("quiz_id", quizIds)
                  .in("user_id", memberIds)
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
        groupName,
        id: quiz.id,
        learnerCount: memberIds.length,
        status: getActivityStatus(statusesByQuizId.get(quiz.id) ?? []),
        title: quiz.title,
        type: getQuizTypeLabel(getQuizType(quiz.quiz_type)),
    }));
}

export async function getOrganizationGroupPageData(
    organizationId: string,
    groupId: string,
): Promise<OrganizationGroupPageData> {
    await requireAdmin();

    const supabase = createAdminClient();
    const { group, organization } = await resolveGroupContext(supabase, organizationId, groupId);
    const memberIds = await listGroupMemberIds(supabase, groupId);
    const [members, roleplays, evaluations] = await Promise.all([
        listGroupMembers(supabase, organizationId, memberIds),
        listGroupRoleplays(supabase, groupId, group.name, memberIds.length),
        listGroupEvaluations(supabase, groupId, group.name, memberIds),
    ]);

    return {
        evaluations,
        group: mapGroupDetail(group, organization, members.length, roleplays.length, evaluations.length),
        members,
        roleplays,
    };
}

export async function getOrganizationGroupDetail(
    organizationId: string,
    groupId: string,
): Promise<OrganizationGroupDetail> {
    const pageData = await getOrganizationGroupPageData(organizationId, groupId);

    return pageData.group;
}

export async function updateOrganizationGroup(
    organizationId: string,
    groupId: string,
    input: CreateOrganizationGroupDto,
): Promise<OrganizationGroupDetail> {
    await requireAdmin();

    const supabase = createAdminClient();
    await resolveGroupContext(supabase, organizationId, groupId);

    const { error } = await supabase
        .from("groups")
        .update({
            description: input.description || null,
            name: input.name,
            updated_at: new Date().toISOString(),
        })
        .eq("id", groupId)
        .eq("organization_id", organizationId);

    if (error) {
        if (isPostgresError(error) && error.code === "23505") {
            throw new AppError("Un groupe avec ce nom existe déjà dans cette organisation.", 409, "GROUP_ALREADY_EXISTS");
        }

        throw error;
    }

    return getOrganizationGroupDetail(organizationId, groupId);
}

export async function archiveOrganizationGroup(organizationId: string, groupId: string) {
    await requireAdmin();

    const supabase = createAdminClient();
    await resolveGroupContext(supabase, organizationId, groupId);

    const { error } = await supabase
        .from("groups")
        .update({
            status: "archived",
            updated_at: new Date().toISOString(),
        })
        .eq("id", groupId)
        .eq("organization_id", organizationId);

    if (error) {
        throw error;
    }
}
