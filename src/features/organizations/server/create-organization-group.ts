import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import type { CreateOrganizationGroupDto } from "@/features/organizations/dto/create-organization-group.dto";
import type { OrganizationGroupRow } from "@/features/organizations/domain/organization-detail";
import { mapOrganizationGroupRow, type OrganizationGroupDbRow } from "./organization-group.mapper";

interface OrganizationExistsRow {
    id: string;
}

function isPostgresError(error: unknown): error is { code?: string } {
    return typeof error === "object" && error !== null && "code" in error;
}

export async function createOrganizationGroup(
    organizationId: string,
    input: CreateOrganizationGroupDto
): Promise<OrganizationGroupRow> {
    await requireAdmin();

    const supabase = createAdminClient();

    const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id")
        .eq("id", organizationId)
        .maybeSingle<OrganizationExistsRow>();

    if (organizationError) {
        throw organizationError;
    }

    if (!organization) {
        throw new NotFoundError("Organisation introuvable.");
    }

    const { data, error } = await supabase
        .from("groups")
        .insert({
            description: input.description || null,
            name: input.name,
            organization_id: organizationId,
            status: "active",
        })
        .select("id, name, description, status, created_at")
        .single<OrganizationGroupDbRow>();

    if (error) {
        if (isPostgresError(error) && error.code === "23505") {
            throw new AppError("Un groupe avec ce nom existe déjà dans cette organisation.", 409, "GROUP_ALREADY_EXISTS");
        }

        throw error;
    }

    return mapOrganizationGroupRow(data);
}
