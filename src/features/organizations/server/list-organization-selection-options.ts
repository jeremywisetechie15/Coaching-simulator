import { requireAdmin } from "@/features/auth/server";
import {
    ORGANIZATION_STATUS,
    type OrganizationSelectionOption,
} from "@/features/organizations/domain/organization-list";
import { createAdminClient } from "@/lib/supabase/admin";

interface OrganizationSelectionRow {
    id: string;
    name: string;
    status: string | null;
}

interface ListOrganizationSelectionOptionsParams {
    includeUnavailableIds?: readonly string[];
}

export async function listOrganizationSelectionOptions({
    includeUnavailableIds = [],
}: ListOrganizationSelectionOptionsParams = {}): Promise<OrganizationSelectionOption[]> {
    await requireAdmin();
    const supabase = createAdminClient();
    const includedIds = new Set(includeUnavailableIds.filter(Boolean));
    const { data, error } = await supabase
        .from("organizations")
        .select("id, name, status")
        .order("name", { ascending: true })
        .returns<OrganizationSelectionRow[]>();

    if (error) throw error;

    return (data ?? [])
        .filter((organization) =>
            organization.status === ORGANIZATION_STATUS.active || includedIds.has(organization.id)
        )
        .map((organization) => ({
            id: organization.id,
            isSelectable: organization.status === ORGANIZATION_STATUS.active,
            name: organization.name,
        }));
}
