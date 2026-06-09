import { AppError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/features/auth/server";
import type { InviteOrganizationUserDto } from "@/features/organizations/dto/invite-organization-user.dto";

interface OrganizationRow {
    id: string;
    name: string;
}

interface MembershipRow {
    id?: string;
    organization_id: string;
    role: string;
    status: string;
    user_id: string;
}

interface OrganizationGroupRow {
    id: string;
    organization_id: string;
}

export async function inviteOrganizationUser(
    organizationId: string,
    input: InviteOrganizationUserDto,
    redirectTo: string
) {
    await requireAdmin();

    const adminSupabase = createAdminClient();

    const { data: organization, error: organizationError } = await adminSupabase
        .from("organizations")
        .select("id, name")
        .eq("id", organizationId)
        .maybeSingle<OrganizationRow>();

    if (organizationError) {
        throw organizationError;
    }

    if (!organization) {
        throw new NotFoundError("Organisation introuvable.");
    }

    if (input.groupId) {
        const { data: group, error: groupError } = await adminSupabase
            .from("groups")
            .select("id, organization_id")
            .eq("id", input.groupId)
            .eq("organization_id", organizationId)
            .maybeSingle<OrganizationGroupRow>();

        if (groupError) {
            throw groupError;
        }

        if (!group) {
            throw new NotFoundError("Groupe introuvable pour cette organisation.");
        }
    }

    const fullName = `${input.firstName} ${input.lastName}`.trim();
    const { data: inviteData, error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
        input.email,
        {
            data: {
                first_name: input.firstName,
                last_name: input.lastName,
                name: fullName,
                organization_id: organizationId,
                organization_name: organization.name,
            },
            redirectTo,
        }
    );

    if (inviteError) {
        throw new AppError(inviteError.message, 400, "INVITE_FAILED");
    }

    const invitedUser = inviteData.user;

    if (!invitedUser?.id) {
        throw new AppError("Invitation créée sans utilisateur.", 500, "INVITE_USER_MISSING");
    }

    const { error: profileError } = await adminSupabase
        .from("profiles")
        .upsert(
            {
                email: input.email,
                first_name: input.firstName,
                id: invitedUser.id,
                last_name: input.lastName,
                name: fullName,
                platform_role: "user",
                updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
        );

    if (profileError) {
        throw profileError;
    }

    const { data: existingMembership, error: membershipFetchError } = await adminSupabase
        .from("organization_members")
        .select("user_id, organization_id, role, status")
        .eq("user_id", invitedUser.id)
        .eq("organization_id", organizationId)
        .maybeSingle<MembershipRow>();

    if (membershipFetchError) {
        throw membershipFetchError;
    }

    if (existingMembership) {
        const { error: membershipUpdateError } = await adminSupabase
            .from("organization_members")
            .update({
                role: input.role,
                status: "invited",
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", invitedUser.id)
            .eq("organization_id", organizationId);

        if (membershipUpdateError) {
            throw membershipUpdateError;
        }
    } else {
        const { error: membershipInsertError } = await adminSupabase
            .from("organization_members")
            .insert({
                organization_id: organizationId,
                role: input.role,
                status: "invited",
                user_id: invitedUser.id,
            });

        if (membershipInsertError) {
            throw membershipInsertError;
        }
    }

    if (input.groupId) {
        const { error: groupMemberError } = await adminSupabase
            .from("group_members")
            .upsert(
                {
                    group_id: input.groupId,
                    user_id: invitedUser.id,
                },
                { onConflict: "group_id,user_id" }
            );

        if (groupMemberError) {
            throw groupMemberError;
        }
    }

    return {
        email: input.email,
        firstName: input.firstName,
        groupId: input.groupId,
        id: invitedUser.id,
        lastName: input.lastName,
        role: input.role,
    };
}
