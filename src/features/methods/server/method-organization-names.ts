import { createAdminClient } from "@/lib/supabase/admin";
import type { MethodRow } from "./method.mapper";

interface OrganizationNameRow {
    id: string;
    name: string;
}

export async function withMethodOrganizationNames<T extends MethodRow>(methods: T[]): Promise<T[]> {
    const organizationIds = Array.from(
        new Set(
            methods
                .map((method) => method.organization_id)
                .filter((organizationId): organizationId is string => Boolean(organizationId)),
        ),
    );

    if (organizationIds.length === 0) {
        return methods;
    }

    const { data, error } = await createAdminClient()
        .from("organizations")
        .select("id, name")
        .in("id", organizationIds)
        .returns<OrganizationNameRow[]>();

    if (error) {
        throw error;
    }

    const organizationNameById = new Map(
        (data ?? []).map((organization) => [organization.id, organization.name]),
    );

    return methods.map((method) => ({
        ...method,
        organization_name: method.organization_id
            ? organizationNameById.get(method.organization_id) ?? null
            : null,
    }));
}
