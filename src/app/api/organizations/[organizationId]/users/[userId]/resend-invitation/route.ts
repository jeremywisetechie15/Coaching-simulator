import { NextRequest, NextResponse } from "next/server";
import {
    PASSWORD_RECOVERY_PURPOSE,
    buildPasswordRecoveryRedirectUrl,
} from "@/features/auth/domain/password-recovery";
import { resendOrganizationInvitationParamsDto } from "@/features/organizations/dto/resend-organization-invitation.dto";
import { resendOrganizationInvitation } from "@/features/organizations/server";
import { jsonError } from "@/lib/server/http";

export const dynamic = "force-dynamic";

interface RouteContext {
    params: Promise<{
        organizationId: string;
        userId: string;
    }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
    try {
        const input = resendOrganizationInvitationParamsDto.parse(await params);
        const redirectTo = buildPasswordRecoveryRedirectUrl(
            request.nextUrl.origin,
            "/profile",
            {
                organizationId: input.organizationId,
                purpose: PASSWORD_RECOVERY_PURPOSE.invitation,
            },
        );
        const invitation = await resendOrganizationInvitation(
            input.organizationId,
            input.userId,
            redirectTo,
        );

        return NextResponse.json({ invitation });
    } catch (error) {
        return jsonError(error);
    }
}
