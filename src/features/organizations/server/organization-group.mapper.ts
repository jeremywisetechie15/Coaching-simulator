import type { OrganizationGroupRow } from "@/features/organizations/domain/organization-detail";

export interface OrganizationGroupDbRow {
    created_at?: string | null;
    description: string | null;
    id: string;
    name: string;
    status: string | null;
}

export function mapOrganizationGroupRow(
    row: OrganizationGroupDbRow,
    memberCount = 0
): OrganizationGroupRow {
    return {
        description: row.description ?? "",
        formationCount: 0,
        id: row.id,
        memberCount,
        name: row.name,
        progress: 0,
        status: row.status === "archived" ? "archived" : "active",
    };
}
