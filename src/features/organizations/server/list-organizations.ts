import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/features/auth/server";
import type { OrganizationListItem } from "@/features/organizations/domain/organization-list";
import {
    mapOrganizationRowToListItem,
    type OrganizationRow,
} from "./organization.mapper";

export async function listOrganizations(): Promise<OrganizationListItem[]> {
    await requireAdmin();

    const supabase = await createClient();

    const { data, error } = await supabase
        .from("organizations")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false })
        .returns<OrganizationRow[]>();

    if (error) {
        throw error;
    }

    return (data ?? []).map(mapOrganizationRowToListItem);
}
