import { requireAdmin } from "@/features/auth/server";
import { ORGANIZATION_USER_REMOVAL_HISTORY_MESSAGE } from "@/features/organizations/domain/organization-user-removal";
import { ConflictError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

interface RemovedOrganizationMembershipRow {
    organization_id: string;
    user_id: string;
}

function isForeignKeyViolation(error: unknown): error is { code: "23503" } {
    return (
        typeof error === "object"
        && error !== null
        && "code" in error
        && error.code === "23503"
    );
}

export async function removeOrganizationUser(organizationId: string, userId: string) {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
        .from("organization_members")
        .delete()
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .select("organization_id, user_id")
        .maybeSingle<RemovedOrganizationMembershipRow>();

    if (error) {
        if (isForeignKeyViolation(error)) {
            throw new ConflictError(ORGANIZATION_USER_REMOVAL_HISTORY_MESSAGE);
        }

        throw error;
    }

    if (!data) {
        throw new NotFoundError("Rattachement utilisateur introuvable.");
    }

    return {
        organizationId: data.organization_id,
        userId: data.user_id,
    };
}
