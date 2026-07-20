import type { PostgrestError } from "@supabase/supabase-js";
import {
    buildAdminDashboardViewData,
    type AdminDashboardContentRecord,
    type AdminDashboardMembershipRecord,
    type AdminDashboardOrganizationRecord,
    type AdminDashboardProfileRecord,
    type AdminDashboardQuizAttemptRecord,
    type AdminDashboardSessionRecord,
    type AdminDashboardViewData,
} from "@/features/admin-dashboard/domain";
import type { AdminDashboardQueryDto } from "@/features/admin-dashboard/dto";
import { isPlatformRole } from "@/features/auth/domain/user-context";
import { requireAdmin } from "@/features/auth/server";
import { normalizeContentStatus } from "@/features/content/domain";
import {
    isOrganizationMemberStatus,
} from "@/features/organizations/domain/organization-member";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import {
    extractAssignmentScore,
} from "@/features/users/server/user-assignment-visibility";
import { PLATFORM_ROLE } from "@/features/users/domain/users";
import { createAdminClient } from "@/lib/supabase/admin";

const PAGE_SIZE = 1_000;

interface PageResult<T> {
    data: T[] | null;
    error: PostgrestError | null;
}

interface OrganizationRow {
    created_at: string | null;
    id: string;
    name: string;
    status: string;
}

interface MembershipRow {
    created_at: string | null;
    organization_id: string;
    status: string;
    user_id: string;
}

interface ContentRow {
    created_at: string | null;
    id: string;
    is_active: boolean | null;
    organization_id: string | null;
    status: string | null;
    title: string;
    updated_at: string | null;
}

interface MethodRow {
    created_at: string | null;
    id: string;
    is_active: boolean | null;
    name: string;
    organization_id: string | null;
    status: string | null;
    updated_at: string | null;
}

interface ProfileRow {
    email: string | null;
    first_name: string | null;
    id: string;
    last_name: string | null;
    name: string | null;
    platform_role: string | null;
}

interface SessionRow {
    created_at: string | null;
    duration_seconds: number | null;
    id: string;
    notation_json: unknown;
    organization_id: string | null;
    scenario_id: string | null;
    status: string | null;
    user_id: string | null;
}

interface RoleplayResultRow {
    score_percent: number | string | null;
    session_id: string;
}

interface QuizAttemptRow {
    completed_at: string | null;
    id: string;
    quiz_id: string;
    score_percent: number | null;
    started_at: string;
    status: string;
    user_id: string;
}

async function fetchAllRows<T>(
    fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
) {
    const rows: T[] = [];

    for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
        if (error) throw error;

        const page = data ?? [];
        rows.push(...page);
        if (page.length < PAGE_SIZE) return rows;
    }
}

function parseScore(value: number | string | null | undefined) {
    const parsed = typeof value === "string" ? Number(value) : value;
    if (typeof parsed !== "number" || !Number.isFinite(parsed)) return null;
    return Math.max(0, Math.min(100, parsed));
}

function mapContent(row: ContentRow): AdminDashboardContentRecord {
    const createdAt = row.created_at ?? new Date(0).toISOString();

    return {
        createdAt,
        id: row.id,
        isActive: row.is_active !== false,
        organizationId: row.organization_id,
        status: normalizeContentStatus(row.status),
        title: row.title,
        updatedAt: row.updated_at ?? createdAt,
    };
}

function profileName(profile: ProfileRow) {
    const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
    return fullName || profile.name?.trim() || profile.email?.split("@")[0] || "Utilisateur";
}

export async function getAdminDashboard(
    input: AdminDashboardQueryDto,
): Promise<AdminDashboardViewData> {
    await requireAdmin();

    const supabase = createAdminClient();
    const [
        organizationRows,
        membershipRows,
        scenarioRows,
        quizRows,
        methodRows,
        skillRows,
        sessionRows,
        roleplayResultRows,
        quizAttemptRows,
        profileRows,
    ] = await Promise.all([
        fetchAllRows<OrganizationRow>((from, to) => supabase
            .from("organizations")
            .select("id, name, status, created_at")
            .order("id")
            .range(from, to)
            .returns<OrganizationRow[]>()),
        fetchAllRows<MembershipRow>((from, to) => supabase
            .from("organization_members")
            .select("organization_id, user_id, status, created_at")
            .order("organization_id")
            .order("user_id")
            .range(from, to)
            .returns<MembershipRow[]>()),
        fetchAllRows<ContentRow>((from, to) => supabase
            .from("scenarios")
            .select("id, title, status, is_active, organization_id, created_at, updated_at")
            .order("id")
            .range(from, to)
            .returns<ContentRow[]>()),
        fetchAllRows<ContentRow>((from, to) => supabase
            .from("quizzes")
            .select("id, title, status, is_active, organization_id, created_at, updated_at")
            .order("id")
            .range(from, to)
            .returns<ContentRow[]>()),
        fetchAllRows<MethodRow>((from, to) => supabase
            .from("methods")
            .select("id, name, status, is_active, organization_id, created_at, updated_at")
            .order("id")
            .range(from, to)
            .returns<MethodRow[]>()),
        fetchAllRows<ContentRow>((from, to) => supabase
            .from("skills")
            .select("id, title:name, status, is_active, organization_id, created_at, updated_at")
            .order("id")
            .range(from, to)
            .returns<ContentRow[]>()),
        fetchAllRows<SessionRow>((from, to) => supabase
            .from("sessions")
            .select("id, scenario_id, user_id, organization_id, status, duration_seconds, created_at, notation_json")
            .order("id")
            .range(from, to)
            .returns<SessionRow[]>()),
        fetchAllRows<RoleplayResultRow>((from, to) => supabase
            .from("roleplay_session_results")
            .select("session_id, score_percent")
            .order("session_id")
            .range(from, to)
            .returns<RoleplayResultRow[]>()),
        fetchAllRows<QuizAttemptRow>((from, to) => supabase
            .from("quiz_attempts")
            .select("id, quiz_id, user_id, status, started_at, completed_at, score_percent")
            .order("id")
            .range(from, to)
            .returns<QuizAttemptRow[]>()),
        fetchAllRows<ProfileRow>((from, to) => supabase
            .from("profiles")
            .select("id, email, name, first_name, last_name, platform_role")
            .order("id")
            .range(from, to)
            .returns<ProfileRow[]>()),
    ]);

    const organizations: AdminDashboardOrganizationRecord[] = organizationRows.map((organization) => ({
        createdAt: organization.created_at ?? new Date(0).toISOString(),
        id: organization.id,
        name: organization.name,
        status: organization.status === ORGANIZATION_STATUS.active
            ? ORGANIZATION_STATUS.active
            : ORGANIZATION_STATUS.suspended,
    }));
    const memberships: AdminDashboardMembershipRecord[] = membershipRows.flatMap((membership) => {
        if (!isOrganizationMemberStatus(membership.status)) return [];
        return [{
            createdAt: membership.created_at ?? new Date(0).toISOString(),
            organizationId: membership.organization_id,
            status: membership.status,
            userId: membership.user_id,
        }];
    });
    const methods = methodRows.map((method) => mapContent({
        ...method,
        title: method.name,
    }));
    const scoresBySessionId = new Map(
        roleplayResultRows.flatMap((result) => {
            const score = parseScore(result.score_percent);
            return score === null ? [] : [[result.session_id, score] as const];
        }),
    );
    const sessions: AdminDashboardSessionRecord[] = sessionRows.flatMap((session) => {
        if (!session.created_at || !session.scenario_id || !session.user_id) return [];
        return [{
            createdAt: session.created_at,
            durationSeconds: session.duration_seconds ?? 0,
            id: session.id,
            organizationId: session.organization_id,
            scenarioId: session.scenario_id,
            scorePercent: scoresBySessionId.get(session.id) ?? extractAssignmentScore(session.notation_json),
            status: session.status ?? "",
            userId: session.user_id,
        }];
    });
    const quizAttempts: AdminDashboardQuizAttemptRecord[] = quizAttemptRows.map((attempt) => ({
        completedAt: attempt.completed_at,
        id: attempt.id,
        quizId: attempt.quiz_id,
        scorePercent: parseScore(attempt.score_percent),
        startedAt: attempt.started_at,
        status: attempt.status,
        userId: attempt.user_id,
    }));
    const profiles: AdminDashboardProfileRecord[] = profileRows.map((profile) => ({
        id: profile.id,
        name: profileName(profile),
        platformRole: isPlatformRole(profile.platform_role)
            ? profile.platform_role
            : PLATFORM_ROLE.user,
    }));

    return buildAdminDashboardViewData({
        methods,
        memberships,
        organizationFilter: input.organization,
        organizations,
        periodDays: input.period,
        profiles,
        quizAttempts,
        quizzes: quizRows.map(mapContent),
        scenarios: scenarioRows.map(mapContent),
        sessions,
        skills: skillRows.map(mapContent),
    });
}
