import { requireAdmin } from "@/features/auth/server";
import {
    getOrganizationRemovalAction,
    ORGANIZATION_MEMBERS_REMOVAL_MESSAGE,
    ORGANIZATION_REMOVAL_ACTION,
    type OrganizationRemovalAction,
    type OrganizationRemovalUsage,
} from "@/features/organizations/domain/organization-deletion";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

interface IdRow {
    id: string;
}

interface OrganizationMemberRow {
    user_id: string | null;
}

function uniqueIds(values: Array<string | null | undefined>) {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function hasCount(result: { count: number | null }) {
    return (result.count ?? 0) > 0;
}

function isPostgresError(error: unknown): error is { code?: string } {
    return typeof error === "object" && error !== null && "code" in error;
}

export interface OrganizationRemovalResult {
    action: OrganizationRemovalAction;
    organizationId: string;
}

async function loadOrganizationRemovalUsage(organizationId: string): Promise<OrganizationRemovalUsage> {
    const adminSupabase = createAdminClient();

    const [organizationResult, membershipsResult, groupsResult] = await Promise.all([
        adminSupabase
            .from("organizations")
            .select("id")
            .eq("id", organizationId)
            .maybeSingle<IdRow>(),
        adminSupabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", organizationId)
            .returns<OrganizationMemberRow[]>(),
        adminSupabase
            .from("groups")
            .select("id")
            .eq("organization_id", organizationId)
            .returns<IdRow[]>(),
    ]);

    if (organizationResult.error) throw organizationResult.error;
    if (membershipsResult.error) throw membershipsResult.error;
    if (groupsResult.error) throw groupsResult.error;
    if (!organizationResult.data) throw new NotFoundError("Organisation introuvable.");

    const memberIds = uniqueIds((membershipsResult.data ?? []).map((membership) => membership.user_id));
    const groupIds = uniqueIds((groupsResult.data ?? []).map((group) => group.id));
    const emptyCountResult = Promise.resolve({ count: 0, error: null });

    const [
        directRoleplaysResult,
        groupRoleplaysResult,
        memberRoleplaysResult,
        sessionsResult,
        methodsResult,
        quizzesResult,
        scorecardsResult,
        skillsResult,
    ] = await Promise.all([
        adminSupabase
            .from("scenarios")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId),
        groupIds.length > 0
            ? adminSupabase.from("scenarios").select("id", { count: "exact", head: true }).in("group_id", groupIds)
            : emptyCountResult,
        memberIds.length > 0
            ? adminSupabase.from("scenarios").select("id", { count: "exact", head: true }).in("assigned_user_id", memberIds)
            : emptyCountResult,
        adminSupabase
            .from("sessions")
            .select("id", { count: "exact", head: true })
            .eq("organization_id", organizationId),
        adminSupabase.from("methods").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
        adminSupabase.from("quizzes").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
        adminSupabase.from("scorecards").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
        adminSupabase.from("skills").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    ]);

    for (const result of [
        directRoleplaysResult,
        groupRoleplaysResult,
        memberRoleplaysResult,
        sessionsResult,
        methodsResult,
        quizzesResult,
        scorecardsResult,
        skillsResult,
    ]) {
        if (result.error) throw result.error;
    }

    return {
        hasAssociatedContent: [methodsResult, quizzesResult, scorecardsResult, skillsResult].some(hasCount),
        hasAssociatedRoleplay: [directRoleplaysResult, groupRoleplaysResult, memberRoleplaysResult].some(hasCount),
        hasMembers: (membershipsResult.data ?? []).length > 0,
        hasSessionHistory: hasCount(sessionsResult),
    };
}

async function assertOrganizationHasNoMembers(organizationId: string) {
    const adminSupabase = createAdminClient();
    const { count, error } = await adminSupabase
        .from("organization_members")
        .select("organization_id", { count: "exact", head: true })
        .eq("organization_id", organizationId);

    if (error) throw error;
    if ((count ?? 0) > 0) {
        throw new ConflictError(ORGANIZATION_MEMBERS_REMOVAL_MESSAGE);
    }
}

async function deactivateOrganization(organizationId: string): Promise<OrganizationRemovalResult> {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("organizations")
        .update({
            status: "suspended",
            updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId)
        .select("id")
        .maybeSingle<IdRow>();

    if (error) throw error;
    if (!data) throw new NotFoundError("Organisation introuvable.");

    return {
        action: ORGANIZATION_REMOVAL_ACTION.deactivate,
        organizationId: data.id,
    };
}

export async function getOrganizationRemovalPlan(organizationId: string): Promise<OrganizationRemovalAction> {
    await requireAdmin();
    const usage = await loadOrganizationRemovalUsage(organizationId);

    return getOrganizationRemovalAction(usage);
}

export async function removeOrganization(organizationId: string): Promise<OrganizationRemovalResult> {
    await requireAdmin();
    const usage = await loadOrganizationRemovalUsage(organizationId);
    const action = getOrganizationRemovalAction(usage);

    if (action === ORGANIZATION_REMOVAL_ACTION.deactivate) {
        return deactivateOrganization(organizationId);
    }

    if (action === ORGANIZATION_REMOVAL_ACTION.blocked) {
        throw new ConflictError(ORGANIZATION_MEMBERS_REMOVAL_MESSAGE);
    }

    // Recheck immediately before the destructive query. The database foreign key
    // is also restrictive so a concurrent membership cannot be deleted by cascade.
    await assertOrganizationHasNoMembers(organizationId);

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("organizations")
        .delete()
        .eq("id", organizationId)
        .select("id")
        .maybeSingle<IdRow>();

    if (error) {
        if (isPostgresError(error) && error.code === "23503") {
            await assertOrganizationHasNoMembers(organizationId);
            return deactivateOrganization(organizationId);
        }

        throw error;
    }

    if (!data) throw new NotFoundError("Organisation introuvable.");

    return {
        action: ORGANIZATION_REMOVAL_ACTION.delete,
        organizationId: data.id,
    };
}
