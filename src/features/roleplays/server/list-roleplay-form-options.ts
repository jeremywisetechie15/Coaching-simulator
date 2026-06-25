import { requireAdmin } from "@/features/auth/server";
import { CONTENT_STATUS } from "@/features/content/domain";
import { listQuizGroupOptions, listQuizUserOptions, listQuizOptions } from "@/features/evaluations/server";
import { listMethods } from "@/features/methods/server";
import { listOrganizations } from "@/features/organizations/server";
import { listCoaches } from "@/features/coaches/server";
import { listPersonas } from "@/features/personas/server";
import { listSkillOptions } from "@/features/skills/server";
import type {
    RoleplayCoachOption,
    RoleplayGroupOption,
    RoleplayMethodOption,
    RoleplayOrganizationOption,
    RoleplayPersonaOption,
    RoleplayQuizOption,
    RoleplayScorecardOption,
    RoleplaySkillOption,
    RoleplayUserOption,
} from "@/features/roleplays/domain";
import { createAdminClient } from "@/lib/supabase/admin";

interface ScorecardOptionRow {
    id: string;
    method_id: string;
    name: string;
    status: string | null;
}

export async function listRoleplayPersonaOptions(): Promise<RoleplayPersonaOption[]> {
    const personas = await listPersonas();

    return personas
        .filter((persona) => persona.status !== CONTENT_STATUS.archived)
        .map((persona) => ({
            avatarUrl: persona.avatarUrl,
            company: persona.company,
            id: persona.id,
            name: persona.name,
            role: persona.role,
        }));
}

export async function listRoleplayCoachOptions(): Promise<RoleplayCoachOption[]> {
    const coaches = await listCoaches();

    return coaches
        .filter((coach) => coach.status !== CONTENT_STATUS.archived)
        .map((coach) => ({
            id: coach.id,
            name: coach.name,
        }));
}

export async function listRoleplayMethodOptions(): Promise<RoleplayMethodOption[]> {
    const methods = await listMethods();

    return methods
        .filter((method) => method.status !== CONTENT_STATUS.archived)
        .map((method) => ({
            id: method.id,
            name: method.name,
            shortName: method.code || method.name,
        }));
}

export async function listRoleplayQuizOptions(): Promise<RoleplayQuizOption[]> {
    const quizzes = await listQuizOptions({ includeArchived: false });

    return quizzes.map((quiz) => ({
        id: quiz.id,
        methodId: quiz.methodId,
        questionCount: quiz.questionCount,
        title: quiz.title,
    }));
}

export async function listRoleplayScorecardOptions(): Promise<RoleplayScorecardOption[]> {
    await requireAdmin();
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("scorecards")
        .select("id, name, method_id, status")
        .neq("status", CONTENT_STATUS.archived)
        .order("name", { ascending: true })
        .returns<ScorecardOptionRow[]>();

    if (error) throw error;

    return (data ?? []).map((scorecard) => ({
        id: scorecard.id,
        methodId: scorecard.method_id,
        name: scorecard.name,
    }));
}

export async function listRoleplayOrganizationOptions(): Promise<RoleplayOrganizationOption[]> {
    const organizations = await listOrganizations();

    return organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
    }));
}

export async function listRoleplayGroupOptions(): Promise<RoleplayGroupOption[]> {
    const groups = await listQuizGroupOptions();

    return groups.map((group) => ({
        id: group.id,
        name: group.name,
        organizationId: group.organizationId,
    }));
}

export async function listRoleplayUserOptions(): Promise<RoleplayUserOption[]> {
    const users = await listQuizUserOptions();

    return users.map((user) => ({
        groupIds: user.groupIds,
        id: user.id,
        name: user.name,
        organizationIds: user.organizationIds,
    }));
}

export async function listRoleplaySkillOptions(): Promise<RoleplaySkillOption[]> {
    const skills = await listSkillOptions();

    return skills.map((skill) => ({
        id: skill.id,
        name: skill.name,
    }));
}
