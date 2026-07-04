import type { OrganizationGroupRow } from "@/features/organizations/domain/organization-detail";

export interface OrganizationGroupDbRow {
    created_at?: string | null;
    description: string | null;
    id: string;
    name: string;
    status: string | null;
}

function formatLongDate(value: string | null | undefined) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

export function mapOrganizationGroupRow(
    row: OrganizationGroupDbRow,
    memberCount = 0,
    roleplayCount = 0,
    quizCount = 0,
): OrganizationGroupRow {
    return {
        createdAt: formatLongDate(row.created_at),
        description: row.description ?? "",
        id: row.id,
        memberCount,
        name: row.name,
        quizCount,
        roleplayCount,
        status: row.status === "archived" ? "archived" : "active",
    };
}
