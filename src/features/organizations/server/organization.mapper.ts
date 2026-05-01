import type { OrganizationListItem, OrganizationStatus } from "@/features/organizations/domain/organization-list";
import type { OrganizationDetail } from "@/features/organizations/domain/organization-detail";

export interface OrganizationRow {
    created_at: string | null;
    id: string;
    name: string;
    status: string | null;
}

export interface OrganizationDetailRow extends OrganizationRow {
    contact_email: string | null;
    industry: string | null;
    phone: string | null;
    region: string | null;
}

function formatDate(value: string | null) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date(value));
}

function formatLongDate(value: string | null) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value));
}

function mapStatus(status: string | null): OrganizationStatus {
    return status === "suspended" ? "suspended" : "active";
}

export function mapOrganizationRowToListItem(row: OrganizationRow): OrganizationListItem {
    return {
        createdAt: formatDate(row.created_at),
        groupCount: 0,
        id: row.id,
        name: row.name,
        programCount: 0,
        status: mapStatus(row.status),
        userCount: 0,
    };
}

export function mapOrganizationRowToDetail(row: OrganizationDetailRow): OrganizationDetail {
    return {
        contactEmail: row.contact_email ?? "",
        createdAt: formatLongDate(row.created_at),
        groupCount: 0,
        id: row.id,
        industry: row.industry ?? "",
        name: row.name,
        phone: row.phone ?? "",
        programCount: 0,
        region: row.region ?? "",
        status: mapStatus(row.status),
        userCount: 0,
    };
}
