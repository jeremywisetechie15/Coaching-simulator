import { requireAdmin } from "@/features/auth/server";
import { CONTENT_VISIBILITY_SCOPE } from "@/features/content/domain";
import { getQuizTypeLabel, type QuizType } from "@/features/evaluations/domain";
import { MINIMUM_EVALUATED_ROLEPLAY_SESSION_DURATION_SECONDS } from "@/features/roleplays/domain";
import type { CreateOrganizationGroupDto } from "@/features/organizations/dto/create-organization-group.dto";
import {
    getOrganizationCohortActivityStatus,
    indexOrganizationLearnerActivitiesByContentId,
} from "@/features/organizations/domain/organization-activity";
import {
    ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE,
    ORGANIZATION_COUNTED_CONTENT_STATUS,
} from "@/features/organizations/domain/organization-content-scope";
import { ORGANIZATION_GROUP_STATUS } from "@/features/organizations/domain/organization-detail";
import type {
    OrganizationEvaluationRow,
    OrganizationGroupDetail,
    OrganizationRoleplayRow,
    OrganizationUserRow,
} from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapOrganizationGroupRow, type OrganizationGroupDbRow } from "./organization-group.mapper";
import {
    filterOrganizationRosterMemberships,
    mapOrganizationUserRows,
    type OrganizationMembershipDbRow,
    type OrganizationUserProfileDbRow,
} from "./list-organization-users";
import { listOrganizationUserAssignmentCounts } from "./list-organization-user-assignment-counts";

interface GroupDbRow extends OrganizationGroupDbRow {
    organization_id: string;
}

interface OrganizationNameRow {
    id: string;
    name: string | null;
    status: string | null;
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
    user_id: string | null;
}

interface OrganizationMemberStatusRow {
    status: string | null;
    user_id: string | null;
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
            .select("id, name, status")
            .eq("id", organizationId)
            .maybeSingle<OrganizationNameRow>(),
        supabase
            .from("groups")
            .select("id, organization_id, name, description, status, created_at")
            .eq("id", groupId)
            .eq("organization_id", organizationId)
            .eq("status", ORGANIZATION_GROUP_STATUS.active)
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

async function listGroupAudience(
    supabase: ReturnType<typeof createAdminClient>,
    organizationId: string,
    organizationStatus: string | null,
    groupId: string,
) {
    const { data, error } = await supabase
        .from("group_members")
        .select("user_id, assigned_at")
        .eq("group_id", groupId)
        .returns<GroupMemberRow[]>();

    if (error) {
        throw error;
    }

    const groupMemberIds = uniqueValues((data ?? []).map((member) => member.user_id));
    if (groupMemberIds.length === 0) {
        return { activeMemberIds: [], rosterMemberIds: [] };
    }

    const membershipsResult = await supabase
        .from("organization_members")
        .select("user_id, status")
        .eq("organization_id", organizationId)
        .in("user_id", groupMemberIds)
        .neq("status", ORGANIZATION_MEMBER_STATUS.removed)
        .returns<OrganizationMemberStatusRow[]>();

    if (membershipsResult.error) {
        throw membershipsResult.error;
    }

    const memberships = membershipsResult.data ?? [];
    return {
        activeMemberIds: organizationStatus === ORGANIZATION_STATUS.active
            ? uniqueValues(
                  memberships
                      .filter((membership) => membership.status === ORGANIZATION_MEMBER_STATUS.active)
                      .map((membership) => membership.user_id),
              )
            : [],
        rosterMemberIds: uniqueValues(memberships.map((membership) => membership.user_id)),
    };
}

async function listGroupMembers(
    supabase: ReturnType<typeof createAdminClient>,
    organizationId: string,
    groupId: string,
    memberIds: string[],
): Promise<OrganizationUserRow[]> {
    if (memberIds.length === 0) {
        return [];
    }

    const [membershipsResult, profilesResult, assignmentCountsByUserId] = await Promise.all([
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
        listOrganizationUserAssignmentCounts(supabase, {
            groupId,
            kind: "group",
            organizationId,
            userIds: memberIds,
        }),
    ]);

    if (membershipsResult.error) {
        throw membershipsResult.error;
    }

    if (profilesResult.error) {
        throw profilesResult.error;
    }

    return mapOrganizationUserRows(
        filterOrganizationRosterMemberships(membershipsResult.data ?? []),
        profilesResult.data ?? [],
        assignmentCountsByUserId,
    );
}

async function listGroupRoleplays(
    supabase: ReturnType<typeof createAdminClient>,
    groupId: string,
    groupName: string,
    learnerIds: string[],
): Promise<OrganizationRoleplayRow[]> {
    const { data: scenarios, error } = await supabase
        .from("scenarios")
        .select("id, title, persona_id, created_at")
        .eq("group_id", groupId)
        .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.group)
        .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
        .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
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
        scenarioIds.length > 0 && learnerIds.length > 0
            ? supabase
                  .from("sessions")
                  .select("scenario_id, user_id, status, duration_seconds")
                  .in("scenario_id", scenarioIds)
                  .in("user_id", learnerIds)
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
    const sessionsByScenarioId = indexOrganizationLearnerActivitiesByContentId(
        sessionsResult.data ?? [],
        (session) => session.scenario_id,
        (session) => session.status,
        (session) => session.user_id,
    );

    return rows.map((scenario) => ({
        assignedAt: formatLongDate(scenario.created_at),
        groupName,
        id: scenario.id,
        learnerCount: learnerIds.length,
        persona: scenario.persona_id ? personaNameById.get(scenario.persona_id) ?? "Persona" : "Persona",
        status: getOrganizationCohortActivityStatus(
            learnerIds,
            sessionsByScenarioId.get(scenario.id) ?? [],
        ),
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
        .eq("visibility_scope", CONTENT_VISIBILITY_SCOPE.group)
        .eq("status", ORGANIZATION_COUNTED_CONTENT_STATUS)
        .eq("is_active", ORGANIZATION_COUNTED_CONTENT_IS_ACTIVE)
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

    const attemptsByQuizId = indexOrganizationLearnerActivitiesByContentId(
        attemptsResult.data ?? [],
        (attempt) => attempt.quiz_id,
        (attempt) => attempt.status,
        (attempt) => attempt.user_id,
    );

    return rows.map((quiz) => ({
        assignedAt: formatLongDate(quiz.created_at),
        groupName,
        id: quiz.id,
        learnerCount: memberIds.length,
        status: getOrganizationCohortActivityStatus(
            memberIds,
            attemptsByQuizId.get(quiz.id) ?? [],
        ),
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
    const { activeMemberIds, rosterMemberIds } = await listGroupAudience(
        supabase,
        organizationId,
        organization.status,
        groupId,
    );
    const [members, roleplays, evaluations] = await Promise.all([
        listGroupMembers(supabase, organizationId, groupId, rosterMemberIds),
        listGroupRoleplays(supabase, groupId, group.name, activeMemberIds),
        listGroupEvaluations(supabase, groupId, group.name, activeMemberIds),
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
            status: ORGANIZATION_GROUP_STATUS.archived,
            updated_at: new Date().toISOString(),
        })
        .eq("id", groupId)
        .eq("organization_id", organizationId);

    if (error) {
        throw error;
    }
}
