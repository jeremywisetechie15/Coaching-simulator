import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import {
    mapOrganizationRowToListItem,
    type OrganizationRow,
} from "./organization.mapper";
import { listOrganizationContentScope } from "./list-organization-content-scope";

export async function listOrganizations(): Promise<OrganizationListItem[]> {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data: organizations, error } = await supabase
        .from("organizations")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false })
        .returns<OrganizationRow[]>();

    if (error) {
        throw error;
    }

    const contentScope = await listOrganizationContentScope(
        supabase,
        (organizations ?? []).map((organization) => organization.id),
    );

    return (organizations ?? []).map((organization) => {
        const counts = contentScope.countsByOrganizationId.get(organization.id);

        return mapOrganizationRowToListItem({
            ...organization,
            group_count: counts?.groupCount ?? 0,
            quiz_count: counts?.quizCount ?? 0,
            roleplay_count: counts?.roleplayCount ?? 0,
            user_count: counts?.userCount ?? 0,
        });
    });
}
