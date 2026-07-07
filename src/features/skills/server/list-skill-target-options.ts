import { requireAdmin } from "@/features/auth/server";
import type {
    ContentTargetGroupOption,
    ContentTargetOrganizationOption,
    ContentTargetUserOption,
} from "@/features/content/domain";
import { listOrganizations } from "@/features/organizations/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface GroupRow {
    id: string;
    name: string;
    organization_id: string | null;
}

interface ProfileRow {
    email: string | null;
    first_name: string | null;
    id: string;
    last_name: string | null;
    name: string | null;
}

interface OrgMemberRow {
    organization_id: string | null;
    user_id: string | null;
}

interface GroupMemberRow {
    group_id: string | null;
    user_id: string | null;
}

export async function listSkillOrganizationOptions(): Promise<ContentTargetOrganizationOption[]> {
    const organizations = await listOrganizations();

    return organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
    }));
}

export async function listSkillGroupOptions(): Promise<ContentTargetGroupOption[]> {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("groups")
        .select("id, name, organization_id")
        .eq("status", "active")
        .order("name", { ascending: true })
        .returns<GroupRow[]>();

    if (error) throw error;

    return (data ?? [])
        .filter((group): group is GroupRow & { organization_id: string } => Boolean(group.organization_id))
        .map((group) => ({
            id: group.id,
            name: group.name,
            organizationId: group.organization_id,
        }));
}

export async function listSkillUserOptions(): Promise<ContentTargetUserOption[]> {
    await requireAdmin();
    const supabase = createAdminClient();

    const [profilesResult, orgMembersResult, groupMembersResult] = await Promise.all([
        supabase.from("profiles").select("id, name, first_name, last_name, email").returns<ProfileRow[]>(),
        supabase.from("organization_members").select("user_id, organization_id").returns<OrgMemberRow[]>(),
        supabase.from("group_members").select("user_id, group_id").returns<GroupMemberRow[]>(),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (orgMembersResult.error) throw orgMembersResult.error;
    if (groupMembersResult.error) throw groupMembersResult.error;

    const organizationIdsByUser = new Map<string, string[]>();
    for (const membership of orgMembersResult.data ?? []) {
        if (!membership.user_id || !membership.organization_id) continue;

        const current = organizationIdsByUser.get(membership.user_id) ?? [];
        if (!current.includes(membership.organization_id)) {
            organizationIdsByUser.set(membership.user_id, [...current, membership.organization_id]);
        }
    }

    const groupIdsByUser = new Map<string, string[]>();
    for (const membership of groupMembersResult.data ?? []) {
        if (!membership.user_id || !membership.group_id) continue;

        const current = groupIdsByUser.get(membership.user_id) ?? [];
        if (!current.includes(membership.group_id)) {
            groupIdsByUser.set(membership.user_id, [...current, membership.group_id]);
        }
    }

    return (profilesResult.data ?? [])
        .map((profile) => {
            const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
            const name = fullName || profile.name || profile.email || "Utilisateur";

            return {
                groupIds: groupIdsByUser.get(profile.id) ?? [],
                id: profile.id,
                name,
                organizationIds: organizationIdsByUser.get(profile.id) ?? [],
            };
        })
        .sort((first, second) => first.name.localeCompare(second.name, "fr-FR"));
}
