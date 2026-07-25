import { requireAdmin } from "@/features/auth/server";
import {
    ORGANIZATION_INVITATION_RESEND_MESSAGES,
    canResendOrganizationInvitation,
    isOrganizationInvitationResendCoolingDown,
} from "@/features/organizations/domain/organization-invitation";
import {
    ORGANIZATION_MEMBER_STATUS,
    isOrganizationMemberStatus,
} from "@/features/organizations/domain/organization-member";
import { AppError, ConflictError, NotFoundError } from "@/lib/server/errors";
import { createAdminClient } from "@/lib/supabase/admin";

interface OrganizationInvitationMembershipRow {
    invitation_sent_at: string | null;
    status: string;
}

interface AuthErrorLike {
    status?: number;
}

function getInvitationSendError(error: AuthErrorLike) {
    if (error.status === 429) {
        return new AppError(
            ORGANIZATION_INVITATION_RESEND_MESSAGES.rateLimited,
            429,
            "INVITATION_RESEND_RATE_LIMITED",
        );
    }

    return new AppError(
        ORGANIZATION_INVITATION_RESEND_MESSAGES.failed,
        502,
        "INVITATION_RESEND_FAILED",
    );
}

export async function resendOrganizationInvitation(
    organizationId: string,
    userId: string,
    redirectTo: string,
) {
    await requireAdmin();

    const adminSupabase = createAdminClient();
    const { data: membership, error: membershipError } = await adminSupabase
        .from("organization_members")
        .select("status, invitation_sent_at")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .maybeSingle<OrganizationInvitationMembershipRow>();

    if (membershipError) {
        throw membershipError;
    }

    if (!membership) {
        throw new NotFoundError(ORGANIZATION_INVITATION_RESEND_MESSAGES.notFound);
    }

    if (
        !isOrganizationMemberStatus(membership.status)
        || !canResendOrganizationInvitation(membership.status)
    ) {
        throw new ConflictError(ORGANIZATION_INVITATION_RESEND_MESSAGES.conflict);
    }

    if (isOrganizationInvitationResendCoolingDown(membership.invitation_sent_at)) {
        throw new AppError(
            ORGANIZATION_INVITATION_RESEND_MESSAGES.rateLimited,
            429,
            "INVITATION_RESEND_RATE_LIMITED",
        );
    }

    const { data: authUserData, error: authUserError } =
        await adminSupabase.auth.admin.getUserById(userId);

    if (authUserError) {
        throw new AppError(
            ORGANIZATION_INVITATION_RESEND_MESSAGES.failed,
            502,
            "INVITATION_AUTH_USER_LOOKUP_FAILED",
        );
    }

    const email = authUserData.user?.email?.trim();

    if (!email) {
        throw new ConflictError(ORGANIZATION_INVITATION_RESEND_MESSAGES.emailMissing);
    }

    const invitationSentAt = new Date().toISOString();
    let reservationQuery = adminSupabase
        .from("organization_members")
        .update({ invitation_sent_at: invitationSentAt })
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .eq("status", ORGANIZATION_MEMBER_STATUS.invited);

    reservationQuery = membership.invitation_sent_at
        ? reservationQuery.eq("invitation_sent_at", membership.invitation_sent_at)
        : reservationQuery.is("invitation_sent_at", null);

    const { data: reservation, error: reservationError } = await reservationQuery
        .select("status, invitation_sent_at")
        .maybeSingle<OrganizationInvitationMembershipRow>();

    if (reservationError) {
        throw reservationError;
    }

    if (!reservation) {
        throw new AppError(
            ORGANIZATION_INVITATION_RESEND_MESSAGES.rateLimited,
            429,
            "INVITATION_RESEND_RATE_LIMITED",
        );
    }

    const { error: sendError } = await adminSupabase.auth.resetPasswordForEmail(email, {
        redirectTo,
    });

    if (sendError) {
        const { error: rollbackError } = await adminSupabase
            .from("organization_members")
            .update({ invitation_sent_at: membership.invitation_sent_at })
            .eq("organization_id", organizationId)
            .eq("user_id", userId)
            .eq("status", ORGANIZATION_MEMBER_STATUS.invited)
            .eq("invitation_sent_at", invitationSentAt);

        if (rollbackError) {
            console.error("Unable to release organization invitation resend reservation.", {
                organizationId,
                rollbackError,
                userId,
            });
        }

        throw getInvitationSendError(sendError);
    }

    return {
        email,
        invitationSentAt,
        organizationId,
        userId,
    };
}
