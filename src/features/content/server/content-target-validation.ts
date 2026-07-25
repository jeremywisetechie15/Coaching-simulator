import type { SupabaseClient } from "@supabase/supabase-js";
import {
    CONTENT_VISIBILITY_SCOPE,
    type ContentAudience,
} from "@/features/content/domain";
import { ORGANIZATION_GROUP_STATUS } from "@/features/organizations/domain/organization-detail";
import { ORGANIZATION_STATUS } from "@/features/organizations/domain/organization-list";
import { ORGANIZATION_MEMBER_STATUS } from "@/features/organizations/domain/organization-member";
import { ConflictError } from "@/lib/server/errors";

interface IdRow {
    id: string;
}

async function assertActiveOrganization(
    supabase: SupabaseClient,
    organizationId: string,
) {
    const { data, error } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", organizationId)
        .eq("status", ORGANIZATION_STATUS.active)
        .maybeSingle<IdRow>();

    if (error) throw error;
    if (!data) {
        throw new ConflictError("L'organisation sélectionnée est désactivée ou introuvable.");
    }
}

async function assertActiveGroup(
    supabase: SupabaseClient,
    groupId: string,
    organizationId: string,
) {
    const { data, error } = await supabase
        .from("groups")
        .select("id")
        .eq("id", groupId)
        .eq("organization_id", organizationId)
        .eq("status", ORGANIZATION_GROUP_STATUS.active)
        .maybeSingle<IdRow>();

    if (error) throw error;
    if (!data) {
        throw new ConflictError("Le groupe sélectionné est archivé ou introuvable.");
    }
}

async function assertActiveUserMembership(
    supabase: SupabaseClient,
    userId: string,
    organizationId: string,
    groupId?: string | null,
) {
    const { data: organizationMembership, error: membershipError } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("user_id", userId)
        .eq("organization_id", organizationId)
        .eq("status", ORGANIZATION_MEMBER_STATUS.active)
        .maybeSingle<{ user_id: string }>();

    if (membershipError) throw membershipError;
    if (!organizationMembership) {
        throw new ConflictError("L'utilisateur sélectionné n'est pas un membre actif de l'organisation.");
    }

    if (!groupId) return;

    const { data: groupMembership, error: groupMembershipError } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("user_id", userId)
        .eq("group_id", groupId)
        .maybeSingle<{ user_id: string }>();

    if (groupMembershipError) throw groupMembershipError;
    if (!groupMembership) {
        throw new ConflictError("L'utilisateur sélectionné n'appartient pas au groupe actif.");
    }
}

export async function assertActiveContentTarget(
    supabase: SupabaseClient,
    audience: ContentAudience,
) {
    if (audience.scope === CONTENT_VISIBILITY_SCOPE.public) return;

    if (!audience.organizationId) {
        throw new ConflictError("Sélectionnez une organisation active.");
    }

    await assertActiveOrganization(supabase, audience.organizationId);

    if (audience.groupId) {
        await assertActiveGroup(supabase, audience.groupId, audience.organizationId);
    }

    if (audience.scope === CONTENT_VISIBILITY_SCOPE.group && !audience.groupId) {
        throw new ConflictError("Sélectionnez un groupe actif.");
    }

    if (audience.scope === CONTENT_VISIBILITY_SCOPE.user) {
        if (!audience.userId) {
            throw new ConflictError("Sélectionnez un utilisateur actif.");
        }

        await assertActiveUserMembership(
            supabase,
            audience.userId,
            audience.organizationId,
            audience.groupId,
        );
    }
}
